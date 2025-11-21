import { gpuCanvas } from './canvas.js';

export class WebGPURenderer {
    constructor() {
        this.device = null;
        this.context = null;
        this.format = null;
        this.renderPipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
        this.isInitialized = false;
        this.fallbackMode = false;
        this.time = 0;
        
        // Bloom settings
        this.bloomEnabled = true;
        this.bloomIntensity = 0.5;
        this.bloomTexture = null;
        this.bloomPipeline = null;
        this.bloomBindGroup = null;
        this.sampler = null;

        this.distortionEnabled = true;
        this.lightingQuality = 1;

        this.particleCount = 0;
        this.particleBuffer = null;
        this.particleStaging = null;
        this.computePipeline = null;
        this.particleRenderPipeline = null;
        this.particleBindGroup = null;
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
        
        // Particle buffer management
        this.particleBufferSize = 0;
        this.particleStagingBuffer = null;
    }

    async init() {
        // Check for WebGPU support
        if (!navigator.gpu) {
            console.warn('WebGPU is not supported in this browser. Falling back to Canvas 2D.');
            this.fallbackMode = true;
            return false;
        }

        try {
            // Request adapter
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                console.warn('Failed to get WebGPU adapter. Falling back to Canvas 2D.');
                this.fallbackMode = true;
                return false;
            }

            // Request device
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
            });

            this.uniformBuffer = this.device.createBuffer({
                size: 48,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            // Create procedural background shader pipeline
            const shaderModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                    }
                    
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    
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
                    
                    // Simple noise function
                    fn hash(p: vec2<f32>) -> f32 {
                        var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.13);
                        p3 += dot(p3, vec3<f32>(p3.y, p3.z, p3.x) + 3.333);
                        return fract((p3.x + p3.y) * p3.z);
                    }
                    
                    fn noise(p: vec2<f32>) -> f32 {
                        let i = floor(p);
                        let f = fract(p);
                        let u = f * f * (3.0 - 2.0 * f);
                        
                        return mix(
                            mix(hash(i + vec2<f32>(0.0, 0.0)), hash(i + vec2<f32>(1.0, 0.0)), u.x),
                            mix(hash(i + vec2<f32>(0.0, 1.0)), hash(i + vec2<f32>(1.0, 1.0)), u.x),
                            u.y
                        );
                    }
                    
                    fn fbm(p: vec2<f32>) -> f32 {
                        var value = 0.0;
                        var amplitude = 0.5;
                        var frequency = 1.0;
                        var pp = p;
                        
                        for (var i = 0; i < 5; i++) {
                            value += amplitude * noise(pp * frequency);
                            frequency *= 2.0;
                            amplitude *= 0.5;
                        }
                        
                        return value;
                    }
                    
                    @fragment
                    fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
                        let resolution = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
                        let uv = input.uv;
                        let aspect = resolution.x / resolution.y;
                        var coord = vec2<f32>(uv.x * aspect, uv.y);
                        
                        // Animated noise layers
                        let time = uniforms.time * 0.1;
                        let noise1 = fbm(coord * 2.0 + vec2<f32>(time * 0.3, time * 0.2));
                        let noise2 = fbm(coord * 3.0 - vec2<f32>(time * 0.2, time * 0.4));
                        let noise3 = fbm(coord * 1.5 + vec2<f32>(sin(time * 0.1), cos(time * 0.15)));
                        
                        // Combine noise layers
                        let combined = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
                        
                        // Dark horror theme colors
                        let darkBase = vec3<f32>(0.02, 0.01, 0.03);
                        let fogColor = vec3<f32>(0.08, 0.05, 0.12);
                        let accentColor = vec3<f32>(0.15, 0.02, 0.08);
                        
                        // Mix colors based on noise
                        var color = mix(darkBase, fogColor, combined);
                        color = mix(color, accentColor, noise2 * 0.3);

                        if (uniforms.distortionEnabled > 0.5) {
                            let swirl = sin(coord.x * 3.0 + time) * cos(coord.y * 3.0 - time) * 0.05;
                            color += vec3<f32>(swirl * 0.2, swirl * 0.1, swirl * 0.3);
                        }
                        
                        // Vignette effect
                        let center = uv - 0.5;
                        let vignette = 1.0 - dot(center, center) * 0.8;
                        color *= vignette;
                        
                        // Apply bloom effect (brighten highlights)
                        let bloomIntensity = uniforms.bloomIntensity;
                        if (bloomIntensity > 0.0) {
                            // Identify bright areas
                            let brightness = dot(color, vec3<f32>(0.299, 0.587, 0.114));
                            let bloomThreshold = 0.1;
                            if (brightness > bloomThreshold) {
                                let bloomAmount = (brightness - bloomThreshold) * bloomIntensity * 3.0;
                                color += vec3<f32>(bloomAmount * 0.3, bloomAmount * 0.2, bloomAmount * 0.5);
                            }
                        }

                        if (uniforms.lightingQuality > 1.5) {
                            let rim = max(0.0, 1.0 - length(uv - 0.5) * 2.0);
                            color += vec3<f32>(rim * 0.02, rim * 0.01, rim * 0.03);
                        }
                        
                        return vec4<f32>(color, 1.0);
                    }
                `,
            });

            // Separate bind group layouts for background rendering and particle system
            // Background render pipeline only needs uniforms (no storage buffers)
            const backgroundBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                ],
            });

            // Create background bind group (only uniforms, no particles)
            this.bindGroup = this.device.createBindGroup({
                layout: backgroundBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                ],
            });

            // Create background pipeline layout
            const backgroundPipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [backgroundBindGroupLayout],
            });

            // Create render pipeline for background
            this.renderPipeline = this.device.createRenderPipeline({
                layout: backgroundPipelineLayout,
                vertex: {
                    module: shaderModule,
                    entryPoint: 'vs_main',
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: 'fs_main',
                    targets: [
                        {
                            format: this.format,
                        },
                    ],
                },
                primitive: {
                    topology: 'triangle-list',
                },
            });

            const computeModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                    }
                    struct Particle {
                        pos: vec2<f32>,
                        vel: vec2<f32>,
                    }
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    @group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
                    @compute @workgroup_size(256)
                    fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
                        let i = gid.x;
                        if (i >= arrayLength(&particles)) { return; }
                        var p = particles[i];
                        let t = uniforms.time;
                        p.vel += vec2<f32>(sin(t + f32(i) * 0.001), cos(t * 0.7 + f32(i) * 0.002)) * 0.0005;
                        p.pos += p.vel;
                        let w = uniforms.resolutionX;
                        let h = uniforms.resolutionY;
                        if (p.pos.x < 0.0) { p.pos.x += w; }
                        if (p.pos.y < 0.0) { p.pos.y += h; }
                        if (p.pos.x > w) { p.pos.x -= w; }
                        if (p.pos.y > h) { p.pos.y -= h; }
                        particles[i] = p;
                    }
                `,
            });

            // Particle system bind group layout (for compute and render)
            // Compute needs read-write, vertex needs read-only
            // Use separate layouts: compute can write, vertex can only read
            this.particleComputeBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // Read-write for compute
                ],
            });

            this.particleRenderBindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                    { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // Read-only for vertex
                ],
            });

            // Create compute pipeline layout
            const computePipelineLayout = this.device.createPipelineLayout({ 
                bindGroupLayouts: [this.particleComputeBindGroupLayout] 
            });

            this.computePipeline = this.device.createComputePipeline({
                layout: computePipelineLayout,
                compute: { module: computeModule, entryPoint: 'main' },
            });

            const particleVertexModule = this.device.createShaderModule({
                code: `
                    struct Uniforms {
                        time: f32,
                        resolutionX: f32,
                        resolutionY: f32,
                        bloomIntensity: f32,
                        distortionEnabled: f32,
                        lightingQuality: f32,
                    }
                    struct Particle { pos: vec2<f32>, vel: vec2<f32> }
                    @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                    @group(0) @binding(1) var<storage> particles: array<Particle>;
                    struct VSOut { @builtin(position) position: vec4<f32> };
                    @vertex fn vs_main(@builtin(vertex_index) i: u32) -> VSOut {
                        let p = particles[i].pos;
                        let x = (p.x / uniforms.resolutionX) * 2.0 - 1.0;
                        let y = (p.y / uniforms.resolutionY) * -2.0 + 1.0;
                        var out: VSOut;
                        out.position = vec4<f32>(x, y, 0.0, 1.0);
                        return out;
                    }
                    @fragment fn fs_main() -> @location(0) vec4<f32> { return vec4<f32>(1.0, 0.8, 0.2, 0.6); }
                `,
            });

            // Create particle render pipeline layout
            const particleRenderPipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [this.particleRenderBindGroupLayout],
            });

            this.particleRenderPipeline = this.device.createRenderPipeline({
                layout: particleRenderPipelineLayout,
                vertex: { module: particleVertexModule, entryPoint: 'vs_main' },
                fragment: { module: particleVertexModule, entryPoint: 'fs_main', targets: [{ format: this.format }] },
                primitive: { topology: 'point-list' },
            });

            this.isInitialized = true;
            console.log('WebGPU renderer initialized successfully.');
            return true;
        } catch (error) {
            console.error('Error initializing WebGPU:', error);
            this.fallbackMode = true;
            return false;
        }
    }

    render(dt) {
        if (!this.isInitialized || this.fallbackMode) {
            return;
        }

        if (!this.context || !this.device || !this.renderPipeline) {
            return;
        }

        try {
            // Update time
            this.time += dt / 1000; // Convert to seconds
            
            // Check if uniforms need updating (dirty flag system)
            const resolutionChanged = gpuCanvas.width !== this.cachedResolutionX ||
                                    gpuCanvas.height !== this.cachedResolutionY;
            const bloomChanged = this.bloomIntensity !== this.cachedBloomIntensity;
            const distortionChanged = this.distortionEnabled !== this.cachedDistortionEnabled;
            const lightingChanged = this.lightingQuality !== this.cachedLightingQuality;
            
            // Always update time, but only update buffer if something changed
            if (this.uniformsDirty || resolutionChanged || bloomChanged || distortionChanged || lightingChanged) {
                const uniformData = new Float32Array([
                    this.time,
                    gpuCanvas.width,
                    gpuCanvas.height,
                    this.bloomIntensity,
                    this.distortionEnabled ? 1 : 0,
                    this.lightingQuality,
                ]);
                this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
                
                // Update cached values
                this.cachedTime = this.time;
                this.cachedResolutionX = gpuCanvas.width;
                this.cachedResolutionY = gpuCanvas.height;
                this.cachedBloomIntensity = this.bloomIntensity;
                this.cachedDistortionEnabled = this.distortionEnabled;
                this.cachedLightingQuality = this.lightingQuality;
                this.uniformsDirty = false;
            }

            const encoder = this.device.createCommandEncoder();

            if (this.particleCount > 0 && this.particleBuffer && this.particleComputeBindGroup) {
                const cPass = encoder.beginComputePass();
                cPass.setPipeline(this.computePipeline);
                cPass.setBindGroup(0, this.particleComputeBindGroup);
                const groups = Math.ceil(this.particleCount / 256);
                cPass.dispatchWorkgroups(groups);
                cPass.end();
            }

            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.context.getCurrentTexture().createView(),
                        clearValue: { r: 0.02, g: 0.01, b: 0.03, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });

            // Set pipeline and bind group for background
            pass.setPipeline(this.renderPipeline);
            pass.setBindGroup(0, this.bindGroup); // Background uses separate bind group
            pass.draw(3, 1, 0, 0);

            // Render particles with separate bind group (read-only storage)
            if (this.particleCount > 0 && this.particleBuffer && this.particleRenderBindGroup) {
                pass.setPipeline(this.particleRenderPipeline);
                pass.setBindGroup(0, this.particleRenderBindGroup);
                pass.draw(this.particleCount, 1, 0, 0);
            }
            pass.end();

            // Submit commands
            this.device.queue.submit([encoder.finish()]);
        } catch (error) {
            console.error('Error rendering WebGPU frame:', error);
            // Graceful fallback: disable WebGPU and fall back to Canvas 2D
            if (!this.fallbackMode) {
                console.warn('WebGPU render error detected, falling back to Canvas 2D');
                this.fallbackMode = true;
            }
            // Don't throw, just log the error to prevent breaking the game loop
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

    setLightingQuality(level) {
        let newQuality = 1;
        if (level === 'off') newQuality = 0;
        else if (level === 'simple') newQuality = 1;
        else newQuality = 2;
        
        if (this.lightingQuality !== newQuality) {
            this.lightingQuality = newQuality;
            this.uniformsDirty = true;
        }
    }

    setParticleCount(level) {
        let count = 0;
        if (level === 'low') count = 0;
        else if (level === 'high') count = 10000;
        else if (level === 'ultra') count = 50000;
        if (count === this.particleCount) return;
        this.particleCount = count;
        if (!this.device) return;
        
        const stride = 16; // 4 floats * 4 bytes each
        const requiredSize = count * stride;
        
        // Only recreate buffer if size changed significantly or doesn't exist
        if (!this.particleBuffer || this.particleBufferSize < requiredSize) {
            // Destroy old buffer if exists
            if (this.particleBuffer) {
                this.particleBuffer.destroy?.();
                this.particleBuffer = null;
            }
            
            if (count > 0) {
                // Create buffer with required size
                this.particleBuffer = this.device.createBuffer({
                    size: requiredSize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                });
                this.particleBufferSize = requiredSize;
                
                // Initialize particle data
                const initData = new Float32Array(count * 4);
                const w = gpuCanvas.width || 1920;
                const h = gpuCanvas.height || 1080;
                for (let i = 0; i < count; i++) {
                    initData[i * 4 + 0] = Math.random() * w;
                    initData[i * 4 + 1] = Math.random() * h;
                    initData[i * 4 + 2] = (Math.random() - 0.5) * 0.5;
                    initData[i * 4 + 3] = (Math.random() - 0.5) * 0.5;
                }
                this.device.queue.writeBuffer(this.particleBuffer, 0, initData.buffer);
                
                // Recreate bind groups with new buffer
                this._createParticleBindGroups();
            } else {
                // No particles - cleanup
                this.particleBufferSize = 0;
                this.particleComputeBindGroup = null;
                this.particleRenderBindGroup = null;
            }
        } else if (count > 0) {
            // Buffer exists and is large enough, just recreate bind groups if needed
            this._createParticleBindGroups();
        } else {
            // No particles - cleanup bind groups
            this.particleComputeBindGroup = null;
            this.particleRenderBindGroup = null;
        }
    }
    
    /**
     * Helper method to create particle bind groups (reused when buffer changes)
     */
    _createParticleBindGroups() {
        if (!this.particleBuffer || !this.particleComputeBindGroupLayout || !this.particleRenderBindGroupLayout) {
            return;
        }
        
        this.particleComputeBindGroup = this.device.createBindGroup({
            layout: this.particleComputeBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } }, // Read-write for compute
            ],
        });
        
        this.particleRenderBindGroup = this.device.createBindGroup({
            layout: this.particleRenderBindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } }, // Read-only for vertex shader
            ],
        });
    }
}

