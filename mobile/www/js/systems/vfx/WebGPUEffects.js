/**
 * Extra WebGPU FX: combat compute particles, point lights, blood-grid render.
 * [TRACE: engine_vfx_modernize]
 */
import { COMBAT_PARTICLE_COMPUTE, COMBAT_PARTICLE_RENDER } from '../../shaders/combatParticles.js';
import { BLOOD_GRID_RENDER, POINT_LIGHTS_SHADER } from '../../shaders/bloodAndLights.js';
import { PARTICLE_KIND } from '../../utils/colorParse.js';

const FLOATS_PER_COMBAT = 12; // pos2 vel2 color4 radius life maxLife kind

export class WebGPUEffects {
    constructor() {
        this.device = null;
        this.format = null;
        this.uniformBuffer = null;
        this.ready = false;

        // Combat GPU particles
        this.combatCapacity = 0;
        this.combatCount = 0;
        this.combatBuffer = null;
        this.combatCPU = null;
        this.combatWrite = 0;
        this.combatComputePipeline = null;
        this.combatRenderPipeline = null;
        this.combatComputeBG = null;
        this.combatRenderBG = null;
        this.combatDtBuffer = null;

        // Point lights
        this.lights = [];
        this.lightUniformBuffer = null;
        this.lightPipeline = null;
        this.lightBG = null;

        // Blood cells (synced from CPU sim)
        this.bloodBuffer = null;
        this.bloodCapacity = 0;
        this.bloodCount = 0;
        this.bloodPipeline = null;
        this.bloodBG = null;
        this.bloodGridParams = null;
    }

    async init(device, format, uniformBuffer) {
        this.device = device;
        this.format = format;
        this.uniformBuffer = uniformBuffer;

        await this._initCombat();
        await this._initLights();
        await this._initBlood();
        this.ready = true;
    }

    async _initCombat() {
        this.combatDtBuffer = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const computeMod = this.device.createShaderModule({ code: COMBAT_PARTICLE_COMPUTE });
        const renderMod = this.device.createShaderModule({ code: COMBAT_PARTICLE_RENDER });

        const computeLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
            ],
        });
        const renderLayout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
            ],
        });

        this.combatComputePipeline = this.device.createComputePipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [computeLayout] }),
            compute: { module: computeMod, entryPoint: 'simulate' },
        });

        this.combatRenderPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [renderLayout] }),
            vertex: { module: renderMod, entryPoint: 'vs_main' },
            fragment: {
                module: renderMod,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        this._combatComputeLayout = computeLayout;
        this._combatRenderLayout = renderLayout;
        this.setCombatCapacity(2048);
    }

    setCombatCapacity(count) {
        if (!this.device || count === this.combatCapacity) return;
        this.combatCapacity = count;
        this.combatCPU = new Float32Array(count * FLOATS_PER_COMBAT);
        this.combatBuffer = this.device.createBuffer({
            size: this.combatCPU.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });
        this.combatWrite = 0;
        this.combatCount = count;

        this.combatComputeBG = this.device.createBindGroup({
            layout: this._combatComputeLayout,
            entries: [
                { binding: 0, resource: { buffer: this.combatDtBuffer } },
                { binding: 1, resource: { buffer: this.combatBuffer } },
            ],
        });
        this.combatRenderBG = this.device.createBindGroup({
            layout: this._combatRenderLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.combatBuffer } },
            ],
        });
    }

    /**
     * Enqueue a GPU combat particle (ring buffer).
     */
    enqueueCombat(x, y, vx, vy, rgba, radius, life, kind = PARTICLE_KIND.spark) {
        if (!this.combatCPU || this.combatCapacity <= 0) return;
        const i = this.combatWrite % this.combatCapacity;
        const o = i * FLOATS_PER_COMBAT;
        this.combatCPU[o] = x;
        this.combatCPU[o + 1] = y;
        this.combatCPU[o + 2] = vx;
        this.combatCPU[o + 3] = vy;
        this.combatCPU[o + 4] = rgba.r;
        this.combatCPU[o + 5] = rgba.g;
        this.combatCPU[o + 6] = rgba.b;
        this.combatCPU[o + 7] = rgba.a;
        this.combatCPU[o + 8] = radius;
        this.combatCPU[o + 9] = life;
        this.combatCPU[o + 10] = life;
        this.combatCPU[o + 11] = kind;
        this.combatWrite++;
        this._combatDirty = true;
    }

    flushCombatBuffer() {
        if (!this._combatDirty || !this.combatBuffer) return;
        this.device.queue.writeBuffer(this.combatBuffer, 0, this.combatCPU);
        this._combatDirty = false;
    }

    async _initLights() {
        // WGSL LightBuffer: count@0 + vec3 pad@16 (ends 28) → array<Light,16> aligns to @32.
        // Size = 32 + 16×32 = 544. (Old `16+16*32` was 528 and failed validation.)
        const lightBytes = 32 + 16 * 32;
        this.lightUniformBuffer = this.device.createBuffer({
            size: lightBytes,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this._lightData = new Float32Array(lightBytes / 4);

        const mod = this.device.createShaderModule({ code: POINT_LIGHTS_SHADER });
        const layout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            ],
        });

        this.lightPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [layout] }),
            vertex: { module: mod, entryPoint: 'vs_main' },
            fragment: {
                module: mod,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        this.lightBG = this.device.createBindGroup({
            layout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.lightUniformBuffer } },
            ],
        });
    }

    clearLights() {
        this.lights.length = 0;
    }

    addLight(x, y, radius, intensity, r, g, b) {
        if (this.lights.length >= 16) return;
        this.lights.push({ x, y, radius, intensity, r, g, b });
    }

    syncLights() {
        if (!this._lightData) return;
        const data = this._lightData;
        data.fill(0);
        data[0] = this.lights.length;
        for (let i = 0; i < this.lights.length; i++) {
            const L = this.lights[i];
            // Lights array starts at byte 32 → float index 8 (not 4).
            const o = 8 + i * 8;
            data[o] = L.x;
            data[o + 1] = L.y;
            data[o + 2] = L.radius;
            data[o + 3] = L.intensity;
            data[o + 4] = L.r;
            data[o + 5] = L.g;
            data[o + 6] = L.b;
            data[o + 7] = 0;
        }
        this.device.queue.writeBuffer(this.lightUniformBuffer, 0, data);
    }

    async _initBlood() {
        this.bloodGridParams = this.device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const mod = this.device.createShaderModule({ code: BLOOD_GRID_RENDER });
        const layout = this.device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
                { binding: 1, visibility: GPUShaderStage.VERTEX, buffer: { type: 'read-only-storage' } },
                { binding: 2, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
            ],
        });

        this.bloodPipeline = this.device.createRenderPipeline({
            layout: this.device.createPipelineLayout({ bindGroupLayouts: [layout] }),
            vertex: { module: mod, entryPoint: 'vs_main' },
            fragment: {
                module: mod,
                entryPoint: 'fs_main',
                targets: [{
                    format: this.format,
                    blend: {
                        color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });
        this._bloodLayout = layout;
    }

    /**
     * Sync non-empty blood cells from CPU sim.
     * @param {Array<{height:number,viscosity:number,worldX:number,worldY:number}>} cells
     * @param {number} cellSize
     */
    syncBloodCells(cells, cellSize = 10) {
        if (!this.device || !cells) {
            this.bloodCount = 0;
            return;
        }
        const max = Math.min(cells.length, 2048);
        if (max === 0) {
            this.bloodCount = 0;
            return;
        }
        const floats = max * 4;
        if (!this.bloodBuffer || this.bloodCapacity < floats) {
            this.bloodBuffer = this.device.createBuffer({
                size: floats * 4,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            });
            this.bloodCapacity = floats;
            this.bloodBG = this.device.createBindGroup({
                layout: this._bloodLayout,
                entries: [
                    { binding: 0, resource: { buffer: this.uniformBuffer } },
                    { binding: 1, resource: { buffer: this.bloodBuffer } },
                    { binding: 2, resource: { buffer: this.bloodGridParams } },
                ],
            });
        }
        const data = new Float32Array(floats);
        for (let i = 0; i < max; i++) {
            const c = cells[i];
            const o = i * 4;
            data[o] = c.height;
            data[o + 1] = c.viscosity;
            data[o + 2] = c.worldX;
            data[o + 3] = c.worldY;
        }
        this.device.queue.writeBuffer(this.bloodBuffer, 0, data);
        this.device.queue.writeBuffer(
            this.bloodGridParams,
            0,
            new Float32Array([0, 0, cellSize, max])
        );
        this.bloodCount = max;
    }

    updateCompute(encoder, dtSec) {
        if (!this.ready || !this.combatComputePipeline) return;
        this.flushCombatBuffer();
        this.device.queue.writeBuffer(
            this.combatDtBuffer,
            0,
            new Float32Array([dtSec, this.combatCapacity, 0, 0])
        );
        const pass = encoder.beginComputePass();
        pass.setPipeline(this.combatComputePipeline);
        pass.setBindGroup(0, this.combatComputeBG);
        pass.dispatchWorkgroups(Math.ceil(this.combatCapacity / 64));
        pass.end();
    }

    /**
     * Draw combat particles, lights, blood into an existing render pass.
     */
    draw(pass, { drawCombat = true, drawLights = true, drawBlood = true } = {}) {
        if (!this.ready) return;

        if (drawBlood && this.bloodCount > 0 && this.bloodPipeline && this.bloodBG) {
            pass.setPipeline(this.bloodPipeline);
            pass.setBindGroup(0, this.bloodBG);
            pass.draw(this.bloodCount * 6);
        }

        if (drawCombat && this.combatCapacity > 0 && this.combatRenderPipeline) {
            pass.setPipeline(this.combatRenderPipeline);
            pass.setBindGroup(0, this.combatRenderBG);
            pass.draw(this.combatCapacity * 6);
        }

        if (drawLights && this.lights.length > 0 && this.lightPipeline) {
            this.syncLights();
            pass.setPipeline(this.lightPipeline);
            pass.setBindGroup(0, this.lightBG);
            pass.draw(6);
        }
    }
}
