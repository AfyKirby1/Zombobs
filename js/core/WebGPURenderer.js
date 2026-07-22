import { gpuCanvas } from './canvas.js';
import { ZombobsFX } from './ZombobsFX.js';
import { GAME_PARTICLE_SHADER } from '../shaders/gameParticles.js';
import { FLASHLIGHT_SHADER } from '../shaders/coneLight.js';
import { BLOOD_EDGE_SHADER } from '../shaders/bloodEdge.js';
import { PostFXPass } from '../systems/vfx/PostFXPass.js';
import { WebGPUEffects } from '../systems/vfx/WebGPUEffects.js';
import { PARTICLE_KIND } from '../utils/colorParse.js';

export class WebGPURenderer {
    constructor() {
        this.device = null;
        this.context = null;
        this.format = null;
        
        // Snow Overlay Pipelines (accumulation disabled — keep stubs for resetSnow)
        this.snowComputePipeline = null;
        this.snowRenderPipeline = null;
        this.snowBindGroup = null;
        this.snowOverlayEnabled = false; // dead path gated off
        
        // Snow Grid Data
        this.snowGridWidth = 128;
        this.snowGridHeight = 128;
        this.snowGridBuffer = null;
        
        this.uniformBuffer = null;
        this.isInitialized = false;
        this.fallbackMode = false;
        this.time = 0;

        // Bloom / post-FX
        this.bloomEnabled = true;
        this.bloomIntensity = 0.5;
        this.postFX = null;
        this.effects = null;
        this.hazeStrength = 0;
        
        this.distortionEnabled = true;
        this.lightingQuality = 1;

        // Falling Snow/Ash Particles
        this.particleCount = 0;
        this.particleBuffer = null;
        this.computePipeline = null;
        this.particleRenderPipeline = null;
        this.particleBindGroup = null; // We'll use a single bind group for simplicity if possible, or separate
        this.particleComputeBindGroup = null;
        this.particleRenderBindGroup = null;
        this.particleComputeBindGroupLayout = null;
        this.particleRenderBindGroupLayout = null;

        // Dirty flags for uniform updates
        this.uniformsDirty = true;
        this.cachedTime = 0;
        this.cachedResolutionX = 0;
        this.cachedResolutionY = 0;
        this.cachedBloomIntensity = -1;
        this.cachedDistortionEnabled = null;
        this.cachedLightingQuality = -1;
        this.cachedCameraX = 0;
        this.cachedCameraY = 0;

        // Particle buffer management
        this.particleBufferSize = 0;

        // Game particle sync (for explosions, etc.)
        this.gameParticleCount = 0;
        this.gameParticleBuffer = null;
        this.gameParticleBufferSize = 0;
        this.gameParticleRenderBindGroup = null;
        this.gameParticleRenderPipeline = null;
        this.gameParticleBindGroupLayout = null;

        // ZombobsFX spore cloud effect
        this.zombobsFX = null;
        this.zombobsFXEnabled = false;
        this.zombobsFXInitPromise = null;
        this.flashlightInitPromise = null;

        // Flashlight System
        this.flashlightEnabled = true;
        this.flashlightBindGroup = null;
        this.flashlightPipeline = null;
        this.flashlightUniformBuffer = null;
        this.zombieBuffer = null;
        this.maxZombies = 100; // Limit for shader performance
        this.cachedFlashlightActive = false;
        this.cachedFlashlightPos = { x: 0, y: 0 };
        this.cachedFlashlightAngle = 0;

        // Blood edge injury overlay (screen-space, gpuCanvas layer)
        this.bloodEdgePipeline = null;
        this.bloodEdgeBindGroup = null;
        this.bloodEdgeUniformBuffer = null;
        this.bloodEdgeInitPromise = null;
        this.bloodEdgeIntensity = 0;
        this.bloodEdgeEnabled = true;
    }

    async init(options = {}) {
        if (this.isInitialized || this.fallbackMode) {
            return this.isInitialized;
        }

        const onPhase = typeof options.onPhase === 'function' ? options.onPhase : null;
        const reportPhase = (phase) => {
            try {
                onPhase?.(phase);
            } catch (error) {
                // Boot UI must never break GPU init.
            }
        };

        // Check for WebGPU support
        if (!navigator.gpu) {
            console.warn('WebGPU is not supported in this browser. Falling back to Canvas 2D.');
            this.fallbackMode = true;
            return false;
        }

        try {
            // Request adapter
            reportPhase('adapter');
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                console.warn('Failed to get WebGPU adapter. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            // Request device
            reportPhase('device');
            this.device = await adapter.requestDevice();

            // Get canvas context
            if (!gpuCanvas) {
                console.warn('gpuCanvas element not found. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            this.context = gpuCanvas.getContext('webgpu');
            if (!this.context) {
                console.warn('Failed to get WebGPU context. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            // Configure context
            this.format = navigator.gpu.getPreferredCanvasFormat();
            this.context.configure({
                device: this.device,
                format: this.format,
                alphaMode: 'premultiplied', // Ensure transparency works correctly
            });

            // 1. Uniform Buffer
            this.uniformBuffer = this.device.createBuffer({
                size: 48,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            // 2. Snow Grid Buffer (Storage)
            const snowGridSize = this.snowGridWidth * this.snowGridHeight * 4; // float32
            this.snowGridBuffer = this.device.createBuffer({
                size: snowGridSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });

            // Initialize Snow Grid with zeros
            this.device.queue.writeBuffer(this.snowGridBuffer, 0, new Float32Array(this.snowGridWidth * this.snowGridHeight));

            // 3. Snow Shader Modules (Split for Compute/Render)
            reportPhase('shaders');
            const snowComputeSource = `
                struct Uniforms {
                    time: f32,
                    resolutionX: f32,
                    resolutionY: f32,
                    bloomIntensity: f32,
                    distortionEnabled: f32,
                    lightingQuality: f32,
                    cameraX: f32,
                    cameraY: f32,
                }
                
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                @group(0) @binding(1) var<storage, read_write> snowGrid: array<f32>;
                
                @compute @workgroup_size(8, 8)
                fn computeMain(@builtin(global_invocation_id) id: vec3<u32>) {
                    let width = 128u;
                    let height = 128u;
                    
                    if (id.x >= width || id.y >= height) { return; }
                    
                    let index = id.y * width + id.x;
                    let seed = f32(index) * 0.1 + uniforms.time;
                    
                    let rnd = fract(sin(seed) * 43758.5453);
                    
                    // Accumulate snow (Slower rate: 0.04 -> 0.005, Frequency: 0.98 -> 0.999)
                    if (rnd > 0.999) {
                        snowGrid[index] = min(snowGrid[index] + 0.005, 1.0);
                    }
                    
                    // Melting (Slower decay: 0.0005 -> 0.0001)
                    if (snowGrid[index] > 0.0) {
                        snowGrid[index] = max(0.0, snowGrid[index] - 0.0001);
                    }
                }
            `;

            const snowRenderSource = `
                struct Uniforms {
                    time: f32,
                    resolutionX: f32,
                    resolutionY: f32,
                    bloomIntensity: f32,
                    distortionEnabled: f32,
                    lightingQuality: f32,
                    cameraX: f32,
                    cameraY: f32,
                }
                
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                @group(0) @binding(1) var<storage, read> snowGrid: array<f32>; // READ-ONLY for render
                
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) uv: vec2<f32>,
                }
                
                @vertex
                fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> VertexOutput {
                    var pos = array<vec2<f32>, 3>(
                        vec2<f32>(-1.0, -1.0),
                        vec2<f32>(3.0, -1.0),
                        vec2<f32>(-1.0, 3.0)
                    );
                    var output: VertexOutput;
                    output.position = vec4<f32>(pos[in_vertex_index], 0.0, 1.0);
                    output.uv = pos[in_vertex_index] * 0.5 + 0.5;
                    return output;
                }
                
                @fragment
                fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
                    let width = 128.0;
                    let height = 128.0;
                    let cameraOffset = vec2<f32>(uniforms.cameraX, uniforms.cameraY);
                    let resolution = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
                    // Flip UV Y because WebGPU NDC Y is Up, but Game World Y is Down
                    let screenUV = vec2<f32>(input.uv.x, 1.0 - input.uv.y);
                    let worldPos = (screenUV * resolution) + cameraOffset;
                    let gridSize = 1000.0;
                    
                    // Use fract() for robust tiling that handles negative coordinates correctly
                    let gridUV = fract(worldPos / gridSize);
                    
                    let x = gridUV.x * width;
                    let y = gridUV.y * height;
                    
                    let x0 = u32(floor(x)) % 128u;
                    let x1 = (x0 + 1u) % 128u;
                    let y0 = u32(floor(y)) % 128u;
                    let y1 = (y0 + 1u) % 128u;
                    
                    let fx = fract(x);
                    let fy = fract(y);
                    
                    let v00 = snowGrid[y0 * 128u + x0];
                    let v10 = snowGrid[y0 * 128u + x1];
                    let v01 = snowGrid[y1 * 128u + x0];
                    let v11 = snowGrid[y1 * 128u + x1];
                    
                    let top = mix(v00, v10, fx);
                    let bottom = mix(v01, v11, fx);
                    let value = mix(top, bottom, fy);
                    
                    // Improved visibility: Lower threshold (0.1 -> 0.05) and softer edge (0.3 -> 0.5)
                    let alpha = smoothstep(0.05, 0.5, value);
                    return vec4<f32>(1.0, 1.0, 1.0, alpha * 0.9);
                }
            `;

            const snowComputeModule = this.device.createShaderModule({ code: snowComputeSource });
            const snowRenderModule = this.device.createShaderModule({ code: snowRenderSource });

            reportPhase('pipelines');
            // 4. Create Bind Group Layouts & Groups for Snow
            // Compute needs writable storage
            const snowComputeBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // Writable
                ],
            });

            // Render needs read-only storage
            const snowRenderBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } }, // Read-only
                ],
            });

            this.snowComputeBindGroup = this.device.createBindGroup({
                layout: snowComputeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.snowGridBuffer } },
                ],
            });

            this.snowRenderBindGroup = this.device.createBindGroup({
                layout: snowRenderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.snowGridBuffer } },
                ],
            });

            // 5. Create Pipelines
            const snowComputePipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [snowComputeBindGroupLayout],
            });
            const snowRenderPipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [snowRenderBindGroupLayout],
            });

            this.snowComputePipeline = this.device.createComputePipeline({
                layout: snowComputePipelineLayout,
                compute: { module: snowComputeModule, entryPoint: 'computeMain' },
            });

            this.snowRenderPipeline = this.device.createRenderPipeline({
                layout: snowRenderPipelineLayout,
                vertex: { module: snowRenderModule, entryPoint: 'vs_main' },
                fragment: {
                    module: snowRenderModule,
                    entryPoint: 'fs_main',
                    targets: [{
                        format: this.format,
                        blend: { // Alpha blending
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        }
                    }],
                },
                primitive: { topology: 'triangle-list' },
            });

            // 6. Falling Snow Particles (Modified from Ash)
            const particleComputeSource = `
                struct Uniforms {
                    time: f32,
                    resolutionX: f32,
                    resolutionY: f32,
                    bloomIntensity: f32,
                    distortionEnabled: f32,
                    lightingQuality: f32,
                    cameraX: f32,
                    cameraY: f32,
                }
                struct Particle {
                    pos: vec2<f32>,
                    vel: vec2<f32>,
                }
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                @group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
                
                @compute @workgroup_size(256)
                fn computeMain(@builtin(global_invocation_id) gid: vec3<u32>) {
                    let i = gid.x;
                    if (i >= arrayLength(&particles)) { return; }
                    var p = particles[i];
                    let t = uniforms.time;
                    
                    let wind = sin(t * 0.5 + p.pos.y * 0.01) * 0.5;
                    p.vel = vec2<f32>(wind, 2.0); 
                    
                    p.pos += p.vel;
                    let w = uniforms.resolutionX;
                    let h = uniforms.resolutionY;
                    
                    if (p.pos.y > h) { 
                        p.pos.y = 0.0; 
                        p.pos.x = fract(sin(f32(i) * t) * 43758.5453) * w; 
                    }
                    if (p.pos.x < 0.0) { p.pos.x += w; }
                    if (p.pos.x > w) { p.pos.x -= w; }
                    
                    particles[i] = p;
                }
            `;

            const particleRenderSource = `
                struct Uniforms {
                    time: f32,
                    resolutionX: f32,
                    resolutionY: f32,
                    bloomIntensity: f32,
                    distortionEnabled: f32,
                    lightingQuality: f32,
                    cameraX: f32,
                    cameraY: f32,
                }
                struct Particle {
                    pos: vec2<f32>,
                    vel: vec2<f32>,
                }
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                @group(0) @binding(1) var<storage, read> particles: array<Particle>; // READ-ONLY
                
                struct VSOut { 
                    @builtin(position) position: vec4<f32>,
                    @location(0) uv: vec2<f32>
                };
                
                @vertex fn vs_main(@builtin(vertex_index) vertexId: u32) -> VSOut {
                    let i = vertexId / 6u;
                    let quadVertex = vertexId % 6u;
                    let p = particles[i].pos;
                    
                    let camPos = vec2<f32>(uniforms.cameraX, uniforms.cameraY);
                    let res = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
                    let size = 3.0;
                    
                    var offset = vec2<f32>(0.0, 0.0);
                    var uv = vec2<f32>(0.0, 0.0);
                    
                    if (quadVertex == 1u || quadVertex == 4u) { offset = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); } 
                    else if (quadVertex == 2u || quadVertex == 3u) { offset = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); } 
                    else if (quadVertex == 5u) { offset = vec2<f32>(1.0, -1.0); uv = vec2<f32>(1.0, 1.0); } 
                    else { offset = vec2<f32>(-1.0, 1.0); uv = vec2<f32>(0.0, 0.0); } 
                    
                    // Decouple from camera:
                    // Treat p.pos as an offset within a world-space tiling volume.
                    // We want the particles to appear fixed in world space (relative to other world objects)
                    // but they are updated in a wrapping screen-space box (0..res).
                    
                    // Logic:
                    // World Position of particle = (p.pos + WorldOffset) % Res
                    // Screen Position = World Position - Camera Position
                    // To make them feel "in world", we can just subtract camera position from their "viewport relative" position
                    // and wrap the result.
                    
                    // Calculate relative position with wrapping
                    // This creates a tiling field of snow that the camera moves over
                    let worldX = p.x - camPos.x;
                    let worldY = p.y - camPos.y;
                    
                    // Wrap to viewport [0, res]
                    let wrappedX = (worldX % res.x + res.x) % res.x;
                    let wrappedY = (worldY % res.y + res.y) % res.y;
                    
                    let x = (wrappedX / res.x) * 2.0 - 1.0;
                    let y = (wrappedY / res.y) * -2.0 + 1.0;
                    
                    let scaleX = size / res.x;
                    let scaleY = size / res.y;
                    
                    var out: VSOut;
                    out.position = vec4<f32>(x + offset.x * scaleX, y + offset.y * scaleY, 0.0, 1.0);
                    out.uv = uv;
                    return out;
                }
                
                @fragment fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
                    let dist = distance(in.uv, vec2<f32>(0.5));
                    let alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                    return vec4<f32>(1.0, 1.0, 1.0, alpha * 0.8);
                }
            `;

            const particleComputeModule = this.device.createShaderModule({ code: particleComputeSource });
            const particleRenderModule = this.device.createShaderModule({ code: particleRenderSource });

            // Setup Particle Bind Groups (Reuse structure from previous code)
            this.particleComputeBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
                ],
            });
            this.particleRenderBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                ],
            });
            
            const computePipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [this.particleComputeBindGroupLayout] });
            this.computePipeline = this.device.createComputePipeline({
                layout: computePipelineLayout,
                compute: { module: particleComputeModule, entryPoint: 'computeMain' },
            });
            
            const renderPipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [this.particleRenderBindGroupLayout] });
            this.particleRenderPipeline = this.device.createRenderPipeline({
                layout: renderPipelineLayout,
                vertex: { module: particleRenderModule, entryPoint: 'vs_main' },
                fragment: { 
                    module: particleRenderModule, 
                    entryPoint: 'fs_main', 
                    targets: [{ 
                        format: this.format,
                        blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' }
                        }
                    }] 
                },
                primitive: { topology: 'triangle-list' },
            });

            // 7. Game Particles (Explosions) - extracted WGSL
             const gameParticleModule = this.device.createShaderModule({
                code: GAME_PARTICLE_SHADER,
            });

            // Fragment also needs storage for kind soft-falloff
            this.gameParticleBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
                ],
            });
            const gameParticlePipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [this.gameParticleBindGroupLayout] });
            this.gameParticleRenderPipeline = this.device.createRenderPipeline({
                layout: gameParticlePipelineLayout,
                vertex: { module: gameParticleModule, entryPoint: 'vs_main' },
                fragment: {
                    module: gameParticleModule, entryPoint: 'fs_main', targets: [{
                        format: this.format, blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                        }
                    }]
                },
                primitive: { topology: 'triangle-list' },
            });

            // Post-FX + extended effects
            this.postFX = new PostFXPass();
            await this.postFX.init(this.device, this.format);
            this.postFX.setQuality(this.lightingQuality === 0 ? 'off' : (this.lightingQuality === 1 ? 'simple' : 'advanced'));

            this.effects = new WebGPUEffects();
            await this.effects.init(this.device, this.format, this.uniformBuffer);

            // ZombobsFX and flashlight init deferred until first gameplay frame

            this.isInitialized = true;
            reportPhase('done');
            return true;
        } catch (error) {
            console.error('Error initializing WebGPU:', error);
            this.fallbackMode = true;
            return false;
        }
    }

    _ensureGameplayEffectsInit() {
        if (this.fallbackMode || !this.isInitialized) return;

        if (this.zombobsFXEnabled && !this.zombobsFX && !this.zombobsFXInitPromise) {
            this.zombobsFX = new ZombobsFX();
            this.zombobsFXInitPromise = this.zombobsFX.init(this.device, this.context, this.format, gpuCanvas)
                .catch(() => {
                    this.zombobsFX = null;
                    this.zombobsFXInitPromise = null;
                });
        }

        if (this.flashlightEnabled && !this.flashlightPipeline && !this.flashlightInitPromise) {
            this.flashlightInitPromise = this._initFlashlight().catch(() => {
                this.flashlightInitPromise = null;
            });
        }

        if (this.bloodEdgeEnabled && !this.bloodEdgePipeline && !this.bloodEdgeInitPromise) {
            this.bloodEdgeInitPromise = this._initBloodEdge().catch(() => {
                this.bloodEdgeInitPromise = null;
            });
        }
    }

    render(dt, camera = { x: 0, y: 0 }, isGameplay = true) {
        if (!this.isInitialized || this.fallbackMode) {
            return;
        }

        if (!this.context || !this.device) {
            return;
        }

        if (!isGameplay) {
            return;
        }

        this._ensureGameplayEffectsInit();

        try {
            // Update time
            this.time += dt / 1000;

            // Check if uniforms need updating
            const resolutionChanged = gpuCanvas.width !== this.cachedResolutionX ||
                gpuCanvas.height !== this.cachedResolutionY;
            const bloomChanged = this.bloomIntensity !== this.cachedBloomIntensity;
            const distortionChanged = this.distortionEnabled !== this.cachedDistortionEnabled;
            const lightingChanged = this.lightingQuality !== this.cachedLightingQuality;
            const cameraChanged = camera.x !== this.cachedCameraX || camera.y !== this.cachedCameraY;

            if (this.uniformsDirty || resolutionChanged || bloomChanged || distortionChanged || lightingChanged || cameraChanged) {
                const uniformData = new Float32Array([
                    this.time,
                    gpuCanvas.width,
                    gpuCanvas.height,
                    this.bloomIntensity,
                    this.distortionEnabled ? 1 : 0,
                    this.lightingQuality,
                    camera.x,
                    camera.y,
                ]);
                this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

                // Update cached values
                this.cachedTime = this.time;
                this.cachedResolutionX = gpuCanvas.width;
                this.cachedResolutionY = gpuCanvas.height;
                this.cachedBloomIntensity = this.bloomIntensity;
                this.cachedDistortionEnabled = this.distortionEnabled;
                this.cachedLightingQuality = this.lightingQuality;
                this.cachedCameraX = camera.x;
                this.cachedCameraY = camera.y;
                this.uniformsDirty = false;
            }

            const encoder = this.device.createCommandEncoder();

            // Decay heat haze
            this.hazeStrength = Math.max(0, (this.hazeStrength || 0) * 0.92);

            // Falling snow compute — only when snow overlay path re-enabled (gated off)
            if (this.snowOverlayEnabled && this.snowEnabled && this.particleCount > 0 && this.particleBuffer && this.particleComputeBindGroup) {
                const cPass = encoder.beginComputePass();
                cPass.setPipeline(this.computePipeline);
                cPass.setBindGroup(0, this.particleComputeBindGroup);
                const groups = Math.ceil(this.particleCount / 256);
                cPass.dispatchWorkgroups(groups);
                cPass.end();
            }

            const showZombobsFX = this.zombobsFXEnabled && isGameplay;
            if (showZombobsFX && this.zombobsFX && this.zombobsFX.isReady()) {
                this.zombobsFX.updateCompute(encoder, dt / 1000);
            }

            // GPU combat particle compute
            if (this.effects?.ready) {
                this.effects.updateCompute(encoder, dt / 1000);
            }

            // Ensure post-FX targets sized
            const useBloom = this.bloomEnabled && this.bloomIntensity > 0.01 && this.postFX?.ready
                && this.lightingQuality > 0;
            if (useBloom) {
                this.postFX.ensureSize(gpuCanvas.width, gpuCanvas.height);
            }
            const fxView = useBloom ? this.postFX.getFxTargetView() : null;
            const swapchainView = this.context.getCurrentTexture().createView();
            const colorView = fxView || swapchainView;

            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: colorView,
                        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 0.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });

            // Snow overlay gated off (accumulation compute disabled; grid always empty)
            if (this.snowOverlayEnabled && this.snowEnabled) {
                pass.setPipeline(this.snowRenderPipeline);
                pass.setBindGroup(0, this.snowRenderBindGroup);
                pass.draw(3, 1, 0, 0);
            }

            if (showZombobsFX && this.zombobsFX && this.zombobsFX.isReady()) {
                this.zombobsFX.render(pass);
            }

            if (this.gameParticleCount > 0 && this.gameParticleBuffer && this.gameParticleRenderBindGroup) {
                pass.setPipeline(this.gameParticleRenderPipeline);
                pass.setBindGroup(0, this.gameParticleRenderBindGroup);
                pass.draw(this.gameParticleCount * 6, 1, 0, 0);
            }

            // Blood / combat GPU / point lights
            if (this.effects?.ready) {
                this.effects.draw(pass);
            }

            if (this.flashlightEnabled && this.flashlightPipeline && this.flashlightBindGroup) {
                pass.setPipeline(this.flashlightPipeline);
                pass.setBindGroup(0, this.flashlightBindGroup);
                pass.draw(6, 1, 0, 0);
            }

            if (this.bloodEdgePipeline && this.bloodEdgeBindGroup && this.bloodEdgeIntensity > 0.02) {
                pass.setPipeline(this.bloodEdgePipeline);
                pass.setBindGroup(0, this.bloodEdgeBindGroup);
                pass.draw(6, 1, 0, 0);
            }

            pass.end();

            if (useBloom && fxView) {
                this.postFX.run(encoder, swapchainView, {
                    bloomIntensity: this.bloomIntensity,
                    distortionEnabled: this.distortionEnabled,
                    time: this.time,
                    hazeStrength: this.hazeStrength || 0,
                });
            }

            // Clear transient lights each frame after draw (callers re-add)
            if (this.effects) {
                this.effects.clearLights();
            }

            this.device.queue.submit([encoder.finish()]);
        } catch (error) {
            console.error('Error rendering WebGPU frame:', error);
            if (!this.fallbackMode) {
                this.fallbackMode = true;
            }
        }
    }

    /**
     * Helper function to check WebGPU availability (consolidates checks)
     */
    static isWebGPUAvailable() {
        return typeof navigator !== 'undefined' && navigator.gpu !== undefined;
    }

    isAvailable() {
        return this.isInitialized && !this.fallbackMode;
    }

    setSnowEnabled(enabled) {
        this.snowEnabled = enabled;
    }

    resetSnow() {
        // Reset the snow accumulation grid to 0
        if (this.snowGridBuffer && this.device) {
            // Create a zero-filled buffer
            const zeroData = new Float32Array(this.snowGridWidth * this.snowGridHeight).fill(0);
            this.device.queue.writeBuffer(this.snowGridBuffer, 0, zeroData);
        }
    }

    setBloomEnabled(enabled) {
        this.bloomEnabled = enabled;
    }

    setBloomIntensity(intensity) {
        const newIntensity = Math.max(0, Math.min(1, intensity));
        if (this.bloomIntensity !== newIntensity) {
            this.bloomIntensity = newIntensity;
            this.uniformsDirty = true;
        }
    }

    setDistortionEffects(enabled) {
        const newEnabled = !!enabled;
        if (this.distortionEnabled !== newEnabled) {
            this.distortionEnabled = newEnabled;
            this.uniformsDirty = true;
        }
    }

    setZombobsFXEnabled(enabled) {
        this.zombobsFXEnabled = enabled;
    }

    setLightingQuality(level) {
        let newQuality = 1;
        if (level === 'off') newQuality = 0;
        else if (level === 'simple') newQuality = 1;
        else newQuality = 2;

        if (this.lightingQuality !== newQuality) {
            this.lightingQuality = newQuality;
            this.uniformsDirty = true;
        }
        if (this.postFX) {
            this.postFX.setQuality(newQuality === 0 ? 'off' : (newQuality === 1 ? 'simple' : 'advanced'));
        }
        if (this.effects) {
            const cap = newQuality >= 2 ? 4096 : (newQuality === 1 ? 2048 : 512);
            this.effects.setCombatCapacity(cap);
        }
    }

    setParticleCount(level) {
        let count = 0;
        if (level === 'low') count = 200;
        else if (level === 'medium') count = 1000;
        else if (level === 'high') count = 2500;
        else if (level === 'ultra') count = 5000;
        else count = 1000;
        
        if (count === this.particleCount) return;
        this.particleCount = count;
        if (!this.device) return;

        const stride = 16; // 4 floats
        const requiredSize = count * stride;

        if (!this.particleBuffer || this.particleBufferSize < requiredSize) {
            if (this.particleBuffer) {
                this.particleBuffer.destroy?.();
                this.particleBuffer = null;
            }

            if (count > 0) {
                this.particleBuffer = this.device.createBuffer({
                    size: requiredSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                });
                this.particleBufferSize = requiredSize;

                const initData = new Float32Array(count * 4);
                const w = gpuCanvas.width || 1920;
                const h = gpuCanvas.height || 1080;
                for (let i = 0; i < count; i++) {
                    initData[i * 4 + 0] = Math.random() * w;
                    initData[i * 4 + 1] = Math.random() * h;
                    initData[i * 4 + 2] = 0;
                    initData[i * 4 + 3] = 0;
                }
                this.device.queue.writeBuffer(this.particleBuffer, 0, initData.buffer);

                this._createParticleBindGroups();
            } else {
                this.particleBufferSize = 0;
                this.particleComputeBindGroup = null;
                this.particleRenderBindGroup = null;
            }
        } else if (count > 0) {
            this._createParticleBindGroups();
        } else {
            this.particleComputeBindGroup = null;
            this.particleRenderBindGroup = null;
        }
    }

    _createParticleBindGroups() {
        if (!this.particleBuffer || !this.particleComputeBindGroupLayout || !this.particleRenderBindGroupLayout) {
            return;
        }

        this.particleComputeBindGroup = this.device.createBindGroup({
            layout: this.particleComputeBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } },
            ],
        });

        this.particleRenderBindGroup = this.device.createBindGroup({
            layout: this.particleRenderBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } },
            ],
        });
    }

    syncGameParticles(particles) {
        if (!this.device || !this.isInitialized || this.fallbackMode) {
            return;
        }

        if (!particles || particles.length === 0) {
            this.gameParticleCount = 0;
            return;
        }

        const count = Math.min(particles.length, 2000);
        const stride = 32;
        const requiredSize = count * stride;

        const needNewBuffer = !this.gameParticleBuffer || this.gameParticleBufferSize < requiredSize;
        if (needNewBuffer) {
            if (this.gameParticleBuffer) {
                this.gameParticleBuffer.destroy?.();
            }

            this.gameParticleBuffer = this.device.createBuffer({
                size: requiredSize,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
            this.gameParticleBufferSize = requiredSize;
            this.gameParticleRenderBindGroup = null;
        }

        const particleData = new Float32Array(count * 8);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            if (!p) continue;

            let r = 1.0, g = 1.0, b = 1.0, a = 1.0;
            if (p.rgba) {
                r = p.rgba.r; g = p.rgba.g; b = p.rgba.b; a = p.rgba.a;
            } else if (p.color) {
                if (p.color.startsWith('rgb')) {
                    const match = p.color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
                    if (match) {
                        r = parseFloat(match[1]) / 255;
                        g = parseFloat(match[2]) / 255;
                        b = parseFloat(match[3]) / 255;
                        a = match[4] ? parseFloat(match[4]) : 1.0;
                    }
                } else if (p.color.startsWith('#')) {
                    const hex = p.color.replace('#', '');
                    r = parseInt(hex.substr(0, 2), 16) / 255;
                    g = parseInt(hex.substr(2, 2), 16) / 255;
                    b = parseInt(hex.substr(4, 2), 16) / 255;
                }
            }

            const maxLife = p.maxLife || p.life || 30;
            const lifeRatio = p.life / maxLife;
            a *= Math.max(0, Math.min(1, lifeRatio));

            const idx = i * 8;
            particleData[idx + 0] = p.x || 0;
            particleData[idx + 1] = p.y || 0;
            particleData[idx + 2] = r;
            particleData[idx + 3] = g;
            particleData[idx + 4] = b;
            particleData[idx + 5] = a;
            particleData[idx + 6] = p.radius || 2;
            particleData[idx + 7] = p.type !== undefined ? p.type : PARTICLE_KIND.spark;
        }

        this.device.queue.writeBuffer(this.gameParticleBuffer, 0, particleData.buffer);
        this.gameParticleCount = count;

        if (!this.gameParticleRenderBindGroup && this.gameParticleBindGroupLayout && this.gameParticleBuffer) {
            this.gameParticleRenderBindGroup = this.device.createBindGroup({
                layout: this.gameParticleBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.gameParticleBuffer } },
                ],
            });
        }
    }

    /**
     * Sync blood pool cells from CPU sim for GPU soft-disc render.
     */
    syncBloodCells(cells, cellSize = 10) {
        if (this.effects?.ready) {
            this.effects.syncBloodCells(cells, cellSize);
        }
    }

    addPointLight(x, y, radius, intensity, r, g, b) {
        if (this.effects?.ready) {
            this.effects.addLight(x, y, radius, intensity, r, g, b);
        }
    }

    updateFlashlight(player, zombies) {
        if (!this.flashlightEnabled || !this.isInitialized || this.fallbackMode) return;
        if (!this.flashlightUniformBuffer || !this.zombieBuffer) {
            this._ensureGameplayEffectsInit();
            return;
        }

        const active = player && player.flashlight && player.flashlight.active;
        const x = player ? player.x : 0;
        const y = player ? player.y : 0;
        const angle = player ? player.angle : 0;

        // Update Flashlight Uniforms
        const flashlightData = new Float32Array([
            x, y,
            angle,
            active ? 1.0 : 0.0,
        ]);
        this.device.queue.writeBuffer(this.flashlightUniformBuffer, 0, flashlightData);

        // Update Zombies
        if (zombies) {
            // Filter zombies within range of the player/flashlight to optimize
            // and ensure closest zombies get lighting priority
            const range = 800; // slightly larger than flashlight range + viewport
            const rangeSq = range * range;
            
            let visibleZombies = [];
            for (let i = 0; i < zombies.length; i++) {
                const z = zombies[i];
                const dx = z.x - x;
                const dy = z.y - y;
                const distSq = dx*dx + dy*dy;
                
                if (distSq < rangeSq) {
                    visibleZombies.push({ z, distSq });
                }
            }
            
            // Sort by distance if we have too many
            if (visibleZombies.length > this.maxZombies) {
                visibleZombies.sort((a, b) => a.distSq - b.distSq);
                visibleZombies = visibleZombies.slice(0, this.maxZombies);
            }

            const count = visibleZombies.length;
            
            // Prepare buffer: count (4 floats padded) + data
            // data is vec4 aligned: pos(2), radius(1), padding(1)
            const bufferData = new Float32Array(4 + count * 4);
            bufferData[0] = count;
            
            for (let i = 0; i < count; i++) {
                const z = visibleZombies[i].z;
                const offset = 4 + i * 4;
                bufferData[offset] = z.x;
                bufferData[offset + 1] = z.y;
                bufferData[offset + 2] = z.radius || 15;
                bufferData[offset + 3] = 0; // Padding
            }
            
            this.device.queue.writeBuffer(this.zombieBuffer, 0, bufferData);
        } else {
             const bufferData = new Float32Array(4);
             bufferData[0] = 0;
             this.device.queue.writeBuffer(this.zombieBuffer, 0, bufferData);
        }
    }

    async _initFlashlight() {
        if (this.fallbackMode) return;

        // Flashlight Uniform Buffer
        this.flashlightUniformBuffer = this.device.createBuffer({
            size: 32, 
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Zombie Storage Buffer
        const zombieBufferSize = 16 + (this.maxZombies * 16);
        this.zombieBuffer = this.device.createBuffer({
            size: zombieBufferSize,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        const module = this.device.createShaderModule({ code: FLASHLIGHT_SHADER });

        // Bind Group Layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
            ],
        });

        // Pipeline Layout
        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        // Pipeline
        this.flashlightPipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: { module, entryPoint: 'vs_main' },
            fragment: {
                module, entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one' }, // Additive blend (premultiplied in shader)
                        alpha: { srcFactor: 'one', dstFactor: 'one' },
                    }
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        // Bind Group
        this.flashlightBindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.flashlightUniformBuffer } },
                { binding: 2, resource: { buffer: this.zombieBuffer } },
            ],
        });
    }

    /**
     * Update screen-edge blood overlay from player health and damage flash.
     * @param {{ enabled?: boolean, healthRatio?: number, damageIntensity?: number }} state
     */
    updateBloodEdge(state = {}) {
        if (!this.isInitialized || this.fallbackMode) return;

        const enabled = state.enabled !== false;
        const healthRatio = Math.max(0, Math.min(1, state.healthRatio ?? 1));
        const damageIntensity = Math.max(0, Math.min(1, state.damageIntensity ?? 0));

        const lowHealthFactor = healthRatio < 0.65
            ? (0.65 - healthRatio) / 0.65
            : 0;
        const targetIntensity = enabled
            ? Math.min(1, lowHealthFactor * 1.15 + damageIntensity * 0.95)
            : 0;

        this.bloodEdgeIntensity += (targetIntensity - this.bloodEdgeIntensity) * 0.22;

        if (!this.bloodEdgeUniformBuffer) {
            this._ensureGameplayEffectsInit();
            return;
        }

        const pulse = healthRatio < 0.35
            ? 0.88 + Math.sin(this.time * 5.5) * 0.12
            : 1.0;

        const uniformData = new Float32Array([
            this.time,
            gpuCanvas.width,
            gpuCanvas.height,
            healthRatio,
            damageIntensity * pulse,
            enabled ? 1 : 0
        ]);
        this.device.queue.writeBuffer(this.bloodEdgeUniformBuffer, 0, uniformData);
    }

    async _initBloodEdge() {
        if (this.fallbackMode || this.bloodEdgePipeline) return;

        this.bloodEdgeUniformBuffer = this.device.createBuffer({
            size: 32,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const module = this.device.createShaderModule({ code: BLOOD_EDGE_SHADER });

        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }
            ]
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        });

        this.bloodEdgePipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: { module, entryPoint: 'vs_main' },
            fragment: {
                module,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' }
                    }
                }]
            },
            primitive: { topology: 'triangle-list' }
        });

        this.bloodEdgeBindGroup = this.device.createBindGroup({
            layout: bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.bloodEdgeUniformBuffer } }
            ]
        });
    }
}
