/**
 * Post-FX: offscreen FX target → bloom extract/blur → composite (+ heat haze).
 * [TRACE: engine_vfx_modernize]
 */
import {
    BLOOM_EXTRACT_SHADER,
    BLOOM_BLUR_SHADER,
    BLOOM_COMPOSITE_SHADER,
} from '../../shaders/bloom.js';

export class PostFXPass {
    constructor() {
        this.device = null;
        this.format = null;
        this.ready = false;

        this.fxTexture = null;
        this.fxView = null;
        this.bloomA = null;
        this.bloomAView = null;
        this.bloomB = null;
        this.bloomBView = null;
        this.sampler = null;

        this.extractPipeline = null;
        this.blurPipeline = null;
        this.compositePipeline = null;

        this.extractParams = null;
        this.blurParams = null;
        this.compositeParams = null;

        this.extractBG = null;
        this.blurSampleA = null; // sample A → write B
        this.blurSampleB = null; // sample B → write A
        this.compositeBG = null;

        this.width = 0;
        this.height = 0;
        this.halfW = 0;
        this.halfH = 0;
        this.quality = 2; // 0 off, 1 simple, 2 advanced
    }

    async init(device, format) {
        this.device = device;
        this.format = format;

        this.sampler = device.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
        });

        this.extractParams = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.blurParams = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });
        this.compositeParams = device.createBuffer({
            size: 48,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const extractMod = device.createShaderModule({ code: BLOOM_EXTRACT_SHADER });
        const blurMod = device.createShaderModule({ code: BLOOM_BLUR_SHADER });
        const compMod = device.createShaderModule({ code: BLOOM_COMPOSITE_SHADER });

        const texLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            ],
        });

        const compLayout = device.createBindGroupLayout({
            entries: [
                { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
                { binding: 2, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
                { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            ],
        });

        const pipeLayout = device.createPipelineLayout({ bindGroupLayouts: [texLayout] });
        const compPipeLayout = device.createPipelineLayout({ bindGroupLayouts: [compLayout] });

        this.extractPipeline = device.createRenderPipeline({
            layout: pipeLayout,
            vertex: { module: extractMod, entryPoint: 'vs_main' },
            fragment: {
                module: extractMod,
                entryPoint: 'fs_main',
                targets: [{ format }],
            },
            primitive: { topology: 'triangle-list' },
        });

        this.blurPipeline = device.createRenderPipeline({
            layout: pipeLayout,
            vertex: { module: blurMod, entryPoint: 'vs_main' },
            fragment: {
                module: blurMod,
                entryPoint: 'fs_main',
                targets: [{ format }],
            },
            primitive: { topology: 'triangle-list' },
        });

        this.compositePipeline = device.createRenderPipeline({
            layout: compPipeLayout,
            vertex: { module: compMod, entryPoint: 'vs_main' },
            fragment: {
                module: compMod,
                entryPoint: 'fs_main',
                targets: [{
                    format,
                    blend: {
                        color: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                        alpha: { srcFactor: 'one', dstFactor: 'zero', operation: 'add' },
                    },
                }],
            },
            primitive: { topology: 'triangle-list' },
        });

        this._texLayout = texLayout;
        this._compLayout = compLayout;
        this.ready = true;
        return true;
    }

    setQuality(level) {
        if (level === 'off' || level === 0) this.quality = 0;
        else if (level === 'simple' || level === 1) this.quality = 1;
        else this.quality = 2;
    }

    ensureSize(width, height) {
        if (!this.device || !this.ready) return;
        width = Math.max(1, width | 0);
        height = Math.max(1, height | 0);
        if (width === this.width && height === this.height && this.fxTexture) return;

        this.width = width;
        this.height = height;
        this.halfW = Math.max(1, width >> 1);
        this.halfH = Math.max(1, height >> 1);

        const makeTex = (w, h, label) => this.device.createTexture({
            label,
            size: { width: w, height: h },
            format: this.format,
            usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        });

        this.fxTexture?.destroy?.();
        this.bloomA?.destroy?.();
        this.bloomB?.destroy?.();

        this.fxTexture = makeTex(width, height, 'postfx-fx');
        this.fxView = this.fxTexture.createView();
        this.bloomA = makeTex(this.halfW, this.halfH, 'postfx-bloom-a');
        this.bloomAView = this.bloomA.createView();
        this.bloomB = makeTex(this.halfW, this.halfH, 'postfx-bloom-b');
        this.bloomBView = this.bloomB.createView();

        this._rebuildBindGroups();
    }

    _rebuildBindGroups() {
        if (!this.fxView || !this.bloomAView || !this.bloomBView) return;

        this.extractBG = this.device.createBindGroup({
            layout: this._texLayout,
            entries: [
                { binding: 0, resource: this.fxView },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: { buffer: this.extractParams } },
            ],
        });

        // Never sample a texture in the same pass that writes to it
        this.blurSampleA = this.device.createBindGroup({
            layout: this._texLayout,
            entries: [
                { binding: 0, resource: this.bloomAView },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: { buffer: this.blurParams } },
            ],
        });

        this.blurSampleB = this.device.createBindGroup({
            layout: this._texLayout,
            entries: [
                { binding: 0, resource: this.bloomBView },
                { binding: 1, resource: this.sampler },
                { binding: 2, resource: { buffer: this.blurParams } },
            ],
        });

        this.compositeBG = this.device.createBindGroup({
            layout: this._compLayout,
            entries: [
                { binding: 0, resource: this.fxView },
                { binding: 1, resource: this.bloomBView },
                { binding: 2, resource: this.sampler },
                { binding: 3, resource: { buffer: this.compositeParams } },
            ],
        });
    }

    /** @returns {GPUTextureView|null} render target for FX pass, or null to draw to swapchain */
    getFxTargetView() {
        if (!this.ready || this.quality === 0 || !this.fxView) return null;
        return this.fxView;
    }

    _blurPass(encoder, sampleBG, targetView) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view: targetView,
                clearValue: { r: 0, g: 0, b: 0, a: 0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        pass.setPipeline(this.blurPipeline);
        pass.setBindGroup(0, sampleBG);
        pass.draw(3);
        pass.end();
    }

    /**
     * Run bloom + composite into swapchain view.
     * Ping-pong: never sample the texture currently bound as color target.
     */
    run(encoder, swapchainView, {
        bloomIntensity = 0.5,
        distortionEnabled = false,
        time = 0,
        hazeStrength = 0,
        aberration = 0,
        grain = 0,
        vignette = 0,
        impulse = 0,
        colorGrading = 0,
        scanlineIntensity = 0,
    } = {}) {
        if (!this.ready || this.quality === 0 || !this.fxView) return false;
        if (!this.extractBG || !this.blurSampleA || !this.blurSampleB || !this.compositeBG) {
            return false;
        }

        const tw = 1 / this.halfW;
        const th = 1 / this.halfH;
        const threshold = this.quality === 1 ? 0.55 : 0.4;

        this.device.queue.writeBuffer(
            this.extractParams,
            0,
            new Float32Array([threshold, Math.max(0.05, bloomIntensity), 0, 0])
        );

        // Extract bright from FX → bloomA
        {
            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: this.bloomAView,
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });
            pass.setPipeline(this.extractPipeline);
            pass.setBindGroup(0, this.extractBG);
            pass.draw(3);
            pass.end();
        }

        // Blur H: sample A → B
        this.device.queue.writeBuffer(
            this.blurParams,
            0,
            new Float32Array([1, 0, tw, th])
        );
        this._blurPass(encoder, this.blurSampleA, this.bloomBView);

        // Blur V: sample B → A
        this.device.queue.writeBuffer(
            this.blurParams,
            0,
            new Float32Array([0, 1, tw, th])
        );
        this._blurPass(encoder, this.blurSampleB, this.bloomAView);

        if (this.quality >= 2) {
            // Extra H: sample A → B (wider bloom)
            this.device.queue.writeBuffer(
                this.blurParams,
                0,
                new Float32Array([1, 0, tw, th])
            );
            this._blurPass(encoder, this.blurSampleA, this.bloomBView);
        } else {
            // Simple: copy A → B so composite always reads bloomB
            this.device.queue.writeBuffer(
                this.blurParams,
                0,
                new Float32Array([0, 0, tw, th])
            );
            this._blurPass(encoder, this.blurSampleA, this.bloomBView);
        }

        this.device.queue.writeBuffer(
            this.compositeParams,
            0,
            new Float32Array([
                bloomIntensity,
                distortionEnabled ? 1 : 0,
                time,
                hazeStrength,
                aberration,
                grain,
                vignette,
                impulse,
                colorGrading,
                scanlineIntensity,
                0,
                0,
            ])
        );

        {
            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view: swapchainView,
                    clearValue: { r: 0, g: 0, b: 0, a: 0 },
                    loadOp: 'clear',
                    storeOp: 'store',
                }],
            });
            pass.setPipeline(this.compositePipeline);
            pass.setBindGroup(0, this.compositeBG);
            pass.draw(3);
            pass.end();
        }

        return true;
    }
}
