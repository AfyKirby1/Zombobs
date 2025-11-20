import { gpuCanvas } from './canvas.js';

export class WebGPURenderer {
    constructor() {
        this.device = null;
        this.context = null;
        this.format = null;
        this.renderPipeline = null;
        this.isInitialized = false;
        this.fallbackMode = false;
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

            // Create a simple render pipeline (clear color for now)
            this.renderPipeline = this.device.createRenderPipeline({
                layout: 'auto',
                vertex: {
                    module: this.device.createShaderModule({
                        code: `
                            @vertex
                            fn vs_main(@builtin(vertex_index) in_vertex_index: u32) -> @builtin(position) vec4<f32> {
                                var pos = array<vec2<f32>, 3>(
                                    vec2<f32>(-1.0, -1.0),
                                    vec2<f32>(3.0, -1.0),
                                    vec2<f32>(-1.0, 3.0)
                                );
                                return vec4<f32>(pos[in_vertex_index], 0.0, 1.0);
                            }
                        `,
                    }),
                    entryPoint: 'vs_main',
                },
                fragment: {
                    module: this.device.createShaderModule({
                        code: `
                            @fragment
                            fn fs_main() -> @location(0) vec4<f32> {
                                // Debug color: dark purple-blue gradient
                                return vec4<f32>(0.1, 0.05, 0.2, 1.0);
                            }
                        `,
                    }),
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
            // Create command encoder
            const encoder = this.device.createCommandEncoder();

            // Begin render pass
            const pass = encoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.context.getCurrentTexture().createView(),
                        clearValue: { r: 0.1, g: 0.05, b: 0.2, a: 1.0 },
                        loadOp: 'clear',
                        storeOp: 'store',
                    },
                ],
            });

            // Set pipeline and draw
            pass.setPipeline(this.renderPipeline);
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
}

