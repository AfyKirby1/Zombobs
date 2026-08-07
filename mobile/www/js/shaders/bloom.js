/** Fullscreen bloom extract / blur / composite (+ optional heat distortion). */

export const BLOOM_EXTRACT_SHADER = `
@group(0) @binding(0) var srcTex: texture_2d<f32>;
@group(0) @binding(1) var srcSamp: sampler;
@group(0) @binding(2) var<uniform> params: vec4<f32>; // threshold, intensity, unused, unused

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VSOut {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0)
    );
    var out: VSOut;
    out.position = vec4<f32>(pos[vi], 0.0, 1.0);
    out.uv = pos[vi] * 0.5 + 0.5;
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    let c = textureSample(srcTex, srcSamp, input.uv);
    let lum = dot(c.rgb, vec3<f32>(0.2126, 0.7152, 0.0722));
    let bright = max(lum - params.x, 0.0) / max(1.0 - params.x, 0.001);
    return vec4<f32>(c.rgb * bright * params.y, c.a);
}
`;

export const BLOOM_BLUR_SHADER = `
@group(0) @binding(0) var srcTex: texture_2d<f32>;
@group(0) @binding(1) var srcSamp: sampler;
@group(0) @binding(2) var<uniform> params: vec4<f32>; // dirX, dirY, texelW, texelH

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VSOut {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0)
    );
    var out: VSOut;
    out.position = vec4<f32>(pos[vi], 0.0, 1.0);
    out.uv = pos[vi] * 0.5 + 0.5;
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    let dir = vec2<f32>(params.x, params.y);
    let texel = vec2<f32>(params.z, params.w);
    var color = vec4<f32>(0.0);
    let offsets = array<f32, 5>(-2.0, -1.0, 0.0, 1.0, 2.0);
    let weights = array<f32, 5>(0.06, 0.24, 0.4, 0.24, 0.06);
    for (var i = 0; i < 5; i++) {
        let uv = input.uv + dir * offsets[i] * texel;
        color += textureSample(srcTex, srcSamp, uv) * weights[i];
    }
    return color;
}
`;

export const BLOOM_COMPOSITE_SHADER = `
@group(0) @binding(0) var fxTex: texture_2d<f32>;
@group(0) @binding(1) var bloomTex: texture_2d<f32>;
@group(0) @binding(2) var samp: sampler;
// params[0]: intensity, distortion, time, hazeStrength
// params[1]: aberration, grain, vignette, impulse
// params[2]: cinematic grade, scanlines, unused, unused
@group(0) @binding(3) var<uniform> params: array<vec4<f32>, 3>;

fn hash21(p: vec2<f32>) -> f32 {
    let q = fract(p * vec2<f32>(127.1, 311.7) + vec2<f32>(74.7, 269.5));
    return fract(sin(dot(q, vec2<f32>(12.9898, 78.233))) * 43758.5453);
}

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VSOut {
    var pos = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(3.0, -1.0),
        vec2<f32>(-1.0, 3.0)
    );
    var out: VSOut;
    out.position = vec4<f32>(pos[vi], 0.0, 1.0);
    out.uv = pos[vi] * 0.5 + 0.5;
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    var uv = input.uv;
    let time = params[0].z;
    // Heat haze / distortion wobble when enabled
    if (params[0].y > 0.5 && params[0].w > 0.01) {
        let wobble = sin(uv.y * 40.0 + time * 8.0) * 0.002 * params[0].w
            + cos(uv.x * 30.0 - time * 6.0) * 0.0015 * params[0].w;
        uv = clamp(uv + vec2<f32>(wobble, wobble * 0.6), vec2<f32>(0.0), vec2<f32>(1.0));
    }

    // Radial chromatic aberration: red shears one way, blue the other,
    // scaled by the aberration amount and (optionally) an impulse kick.
    var dv = uv - vec2<f32>(0.5, 0.5);
    dv *= vec2<f32>(1.5, 1.0); // correct for aspect before radius math
    let dist = length(dv);
    let ab = params[1].x * dist * dist * 0.008 + params[1].w * 0.0012;
    let rUv = clamp(uv + dv * ab, vec2<f32>(0.0), vec2<f32>(1.0));
    let bUv = clamp(uv - dv * ab, vec2<f32>(0.0), vec2<f32>(1.0));
    // Keep source alpha — gpuCanvas is a transparent FX overlay over Canvas2D.
    // Forcing a=1 painted opaque black and hid the whole game world.
    let fxSample = textureSample(fxTex, samp, uv);
    let rC = textureSample(fxTex, samp, rUv).r;
    let gC = fxSample.g;
    let bC = textureSample(fxTex, samp, bUv).b;
    let bloom = textureSample(bloomTex, samp, uv);

    var outRgb = vec3<f32>(rC, gC, bC) + bloom.rgb * params[0].x;
    var outA = max(fxSample.a, bloom.a * params[0].x);

    // Animated film grain as a real translucent overlay. Positive noise adds a
    // pale fleck; negative noise lays a black fleck, so it reads over Canvas2D.
    let grain = params[1].y;
    if (grain > 0.001) {
        let noise = hash21(input.uv * 1200.0 + time * 60.0) - 0.5;
        let grainAlpha = abs(noise) * grain * 0.38;
        let grainColor = select(vec3<f32>(0.0), vec3<f32>(0.85, 0.9, 0.82), noise > 0.0);
        outRgb = grainColor * grainAlpha + outRgb * (1.0 - grainAlpha);
        outA = grainAlpha + outA * (1.0 - grainAlpha);
    }

    // Vignette is composed as translucent black, allowing the WebGPU overlay
    // to darken the Canvas2D world underneath instead of only its own particles.
    let vignette = params[1].z;
    if (vignette > 0.001) {
        let d = length((input.uv - vec2<f32>(0.5)) * vec2<f32>(1.5, 1.0));
        let vignetteAlpha = smoothstep(0.52, 1.05, d) * vignette * 0.48;
        outRgb *= 1.0 - vignetteAlpha;
        outA = vignetteAlpha + outA * (1.0 - vignetteAlpha);
    }

    // Horror-grade atmospheric wash: cooler overhead, warmer near the floor.
    let grade = params[2].x;
    if (grade > 0.001) {
        let tint = mix(vec3<f32>(0.01, 0.07, 0.08), vec3<f32>(0.11, 0.025, 0.015), smoothstep(0.25, 1.0, input.uv.y));
        let gradeAlpha = grade * 0.055;
        outRgb = tint * gradeAlpha + outRgb * (1.0 - gradeAlpha);
        outA = gradeAlpha + outA * (1.0 - gradeAlpha);
    }

    // Fine CRT scanlines, intentionally subtle even at the default setting.
    let scanlines = params[2].y;
    if (scanlines > 0.001) {
        let line = 0.5 + 0.5 * sin(input.uv.y * 1400.0 + time * 0.35);
        let lineAlpha = (1.0 - line) * scanlines * 0.34;
        outRgb *= 1.0 - lineAlpha;
        outA = lineAlpha + outA * (1.0 - lineAlpha);
    }

    // Explosion / damage impulse: white flash weighted toward the frame center.
    let impulse = params[1].w;
    if (impulse > 0.002) {
        let centerLen = length((input.uv - vec2<f32>(0.5)) * vec2<f32>(1.5, 1.0));
        let flash = exp(-centerLen * 4.5) * impulse * (1.6 - impulse * 0.6);
        outRgb += vec3<f32>(flash);
        outA = min(1.0, outA + flash);
    }

    return vec4<f32>(outRgb, outA);
}
`;
