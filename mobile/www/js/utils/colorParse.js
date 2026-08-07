/**
 * Color parse helpers for particle RGBA caching.
 * [TRACE: engine_vfx_modernize]
 */

/**
 * Parse CSS color string to {r,g,b,a} in 0–1 range.
 * @param {string} color
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
export function parseColorToRgba(color) {
    let r = 1, g = 1, b = 1, a = 1;
    if (!color || typeof color !== 'string') {
        return { r, g, b, a };
    }
    if (color.startsWith('rgb')) {
        const match = color.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
        if (match) {
            r = parseFloat(match[1]) / 255;
            g = parseFloat(match[2]) / 255;
            b = parseFloat(match[3]) / 255;
            a = match[4] !== undefined ? parseFloat(match[4]) : 1;
        }
    } else if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length >= 6) {
            r = parseInt(hex.slice(0, 2), 16) / 255;
            g = parseInt(hex.slice(2, 4), 16) / 255;
            b = parseInt(hex.slice(4, 6), 16) / 255;
        }
    }
    return { r, g, b, a };
}

/** Particle kind IDs for GPU soft-falloff variants. */
export const PARTICLE_KIND = Object.freeze({
    spark: 0,
    blood: 1,
    smoke: 2,
    fire: 3,
    debris: 4,
    flash: 5,
    shockwave: 6,
    snow: 7,
    muzzle: 8,
    ember: 9,
});

export const PARTICLE_KIND_NAME = Object.freeze(
    Object.fromEntries(Object.entries(PARTICLE_KIND).map(([k, v]) => [v, k]))
);

/**
 * Soft per-kind budget fractions of global particle limit.
 */
export const PARTICLE_KIND_BUDGET = Object.freeze({
    [PARTICLE_KIND.blood]: 0.35,
    [PARTICLE_KIND.smoke]: 0.2,
    [PARTICLE_KIND.fire]: 0.2,
    [PARTICLE_KIND.flash]: 0.08,
    [PARTICLE_KIND.shockwave]: 0.1,
    [PARTICLE_KIND.debris]: 0.1,
    [PARTICLE_KIND.snow]: 0.3,
    [PARTICLE_KIND.ember]: 0.1,
    [PARTICLE_KIND.muzzle]: 0.1,
    [PARTICLE_KIND.spark]: 0.15,
});
