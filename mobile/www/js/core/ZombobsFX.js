import { ZOMBOBS_FX_SHADER } from '../shaders/zombobsFX.js';

export class ZombobsFX {
    constructor() {
        this.canvas = null;
        this.device = null;
        this.context = null;
        this.format = null;
        this.pipeline = null;
        this.computePipeline = null;
        this.computeBindGroups = [];
        this.renderBindGroups = [];
        
        // ============================================
        // INTENSITY ADJUSTMENT PARAMETERS
        // ============================================
        // Adjust these values to control effect intensity:
        
        // Particle count - More particles = denser cloud (performance impact)
        // Range: 10,000 - 200,000 (default: 25,000 - reduced from 100k for lower intensity)
        this.numParticles = 25000; // Reduced to 25k for 75% intensity reduction
        
        // Particle size - Larger = more visible particles (in vertex shader, line ~132)
        // Current: 0.008 (0.8% of screen), try 0.005-0.015 for adjustment
        
        // Repel strength - How strongly particles react to mouse (in updateCompute, line ~294)
        // Current: 2.0, try 1.0-5.0 for adjustment
        
        // Alpha multiplier - Overall opacity of particles (in vertex shader, line ~143)
        // Current: 0.8 (80% opacity), try 0.5-1.0 for adjustment
        
        // Flow speed - Particle movement speed (in compute shader, line ~78)
        // Current: 0.002, try 0.001-0.005 for adjustment
        
        // Repel distance - Mouse interaction range (in compute shader, line ~86)
        // Current: 0.3 (30% of screen), try 0.2-0.5 for adjustment
        
        this.mouseX = 0;
        this.mouseY = 0;
        this.frame = 0;
        this.initialized = false;
        
        // Parameters
        this.paramsBuffer = null;
        this.particleBuffers = null;
    }

    async init(device, context, format, canvas) {
        // Use provided device/context instead of creating new ones
        this.device = device;
        this.context = context;
        this.format = format;
        this.canvas = canvas;

        if (!this.device || !this.context || !this.format || !this.canvas) {
            console.error("ZombobsFX: Missing required parameters (device, context, format, canvas)");
            return false;
        }

        await this.createAssets();
        this.setupInput();
        this.initialized = true;
        return true;
    }

    async createAssets() {
        const shaderModule = this.device.createShaderModule({
            label: 'Zombobs Shaders',
            code: ZOMBOBS_FX_SHADER,
        });

        // Initial Particle Data
        const initialParticleData = new Float32Array(this.numParticles * 6); // 4 floats (pos, vel) + 2 (life, pad)
        for (let i = 0; i < this.numParticles; ++i) {
            initialParticleData[i * 6 + 0] = (Math.random() * 2 - 1); // x
            initialParticleData[i * 6 + 1] = (Math.random() * 2 - 1); // y
            initialParticleData[i * 6 + 2] = 0; // vx
            initialParticleData[i * 6 + 3] = 0; // vy
            initialParticleData[i * 6 + 4] = Math.random(); // life
            initialParticleData[i * 6 + 5] = 0; // padding
        }

        this.particleBuffers = [
            this.device.createBuffer({ size: initialParticleData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST, mappedAtCreation: true }),
            this.device.createBuffer({ size: initialParticleData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST })
        ];
        new Float32Array(this.particleBuffers[0].getMappedRange()).set(initialParticleData);
        this.particleBuffers[0].unmap();

        // Uniform Buffer
        this.paramsBuffer = this.device.createBuffer({
            size: 16, // 4 floats
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Pipelines
        // Separate bind group layouts: compute needs read_write, render needs read-only
        const computeBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // read_write for compute
                { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } }, // read_write for compute
            ]
        });

        const renderBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } }, // read-only for vertex
            ]
        });

        // Create pipeline layouts
        // Compute pipeline only needs compute bind group layout (uses @group(0))
        this.computePipelineLayout = this.device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] });
        // Render pipeline uses @group(1), so pipeline layout needs bind group layout at index 1
        // Index 0 can be empty/dummy since render shader doesn't use it
        // Create a minimal bind group layout for index 0 (won't be used, but required by WebGPU)
        const dummyBindGroupLayout = this.device.createBindGroupLayout({ entries: [] });
        this.renderPipelineLayout = this.device.createPipelineLayout({ 
            bindGroupLayouts: [dummyBindGroupLayout, renderBindGroupLayout] // Index 0 (dummy), Index 1 (render)
        });

        this.computePipeline = this.device.createComputePipeline({
            layout: this.computePipelineLayout,
            compute: { module: shaderModule, entryPoint: 'simulate' }
        });

        // Render Pipeline
        this.pipeline = this.device.createRenderPipeline({
            layout: this.renderPipelineLayout,
            vertex: { module: shaderModule, entryPoint: 'vs_main' },
            fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ 
                format: this.format,
                blend: {
                    color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' }, // Additive Blending for Glow
                    alpha: { srcFactor: 'zero', dstFactor: 'one', operation: 'add' }
                }
            }] },
            primitive: { topology: 'triangle-list' }
        });

        // Create Bind Groups (Double buffering for ping-pong)
        // Compute bind groups (read_write storage)
        this.computeBindGroups = [
            this.device.createBindGroup({
                layout: computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.paramsBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[1] } },
                ]
            }),
            this.device.createBindGroup({
                layout: computeBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.paramsBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } },
                    { binding: 2, resource: { buffer: this.particleBuffers[0] } },
                ]
            })
        ];

        // Render bind groups (read-only storage for vertex shader)
        this.renderBindGroups = [
            this.device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.paramsBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[0] } },
                ]
            }),
            this.device.createBindGroup({
                layout: renderBindGroupLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.paramsBuffer } },
                    { binding: 1, resource: { buffer: this.particleBuffers[1] } },
                ]
            })
        ];
    }

    setupInput() {
        if (!this.canvas) return;
        
        // Remove existing listener if any (prevent duplicates)
        if (this.mouseMoveHandler) {
            window.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        
        this.mouseMoveHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Map mouse to -1 to 1
            this.mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1); // Flip Y
        };
        
        window.addEventListener('mousemove', this.mouseMoveHandler);
    }

    // Update compute pass - must be called BEFORE render pass starts
    updateCompute(commandEncoder, dt = 0.016) {
        if (!this.initialized || !this.paramsBuffer || !this.computeBindGroups) {
            return;
        }

        // Update Uniforms
        // ADJUSTMENT: Change 2.0 (repelStrength) to adjust mouse repulsion intensity (1.0 = weak, 5.0 = strong)
        const paramsData = new Float32Array([dt, this.mouseX, this.mouseY, 2.0]);
        this.device.queue.writeBuffer(this.paramsBuffer, 0, paramsData);

        // Compute Pass (update particles)
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.computeBindGroups[this.frame % 2]);
        computePass.dispatchWorkgroups(Math.ceil(this.numParticles / 64));
        computePass.end();

        this.frame++;
    }

    // Render method - called during render pass
    render(renderPass) {
        if (!this.initialized || !this.renderBindGroups) {
            return;
        }

        // Render Pass (draw particles) - uses existing renderPass from WebGPURenderer
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(1, this.renderBindGroups[(this.frame - 1) % 2]); // Use previous frame's buffer (after compute updates)
        renderPass.draw(6, this.numParticles); // Draw 6 vertices (quad) per particle
    }

    isReady() {
        return this.initialized && this.paramsBuffer && this.computeBindGroups && this.renderBindGroups && this.pipeline && this.computePipeline;
    }
}

