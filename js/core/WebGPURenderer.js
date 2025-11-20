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

            // Create uniform buffer for time, resolution, and bloom
            this.uniformBuffer = this.device.createBuffer({
                size: 32, // 8 floats: time, resolution.x, resolution.y, bloomIntensity, padding...
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
                        
                        return vec4<f32>(color, 1.0);
                    }
                `,
            });

            // Create bind group layout
            const bindGroupLayout = this.device.createBindGroupLayout({
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.FRAGMENT,
                        buffer: { type: 'uniform' },
                    },
                ],
            });

            // Create bind group
            this.bindGroup = this.device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: { buffer: this.uniformBuffer },
                    },
                ],
            });

            // Create pipeline layout
            const pipelineLayout = this.device.createPipelineLayout({
                bindGroupLayouts: [bindGroupLayout],
            });

            // Create render pipeline
            this.renderPipeline = this.device.createRenderPipeline({
                layout: pipelineLayout,
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

            // Update uniforms
            const uniformData = new Float32Array([
                this.time,
                gpuCanvas.width,
                gpuCanvas.height,
                this.bloomIntensity,
            ]);
            this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);

            // Create command encoder
            const encoder = this.device.createCommandEncoder();

            // Begin render pass
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

            // Set pipeline and bind group
            pass.setPipeline(this.renderPipeline);
            pass.setBindGroup(0, this.bindGroup);
            pass.draw(3, 1, 0, 0);
            pass.end();

            // Submit commands
            this.device.queue.submit([encoder.finish()]);
        } catch (error) {
            console.error('Error rendering WebGPU frame:', error);
            // Don't throw, just log the error to prevent breaking the game loop
        }
    }

    isAvailable() {
        return this.isInitialized && !this.fallbackMode;
    }

    setBloomEnabled(enabled) {
        this.bloomEnabled = enabled;
    }

    setBloomIntensity(intensity) {
        this.bloomIntensity = Math.max(0, Math.min(1, intensity));
    }
}

