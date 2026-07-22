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
@group(0) @binding(3) var<uniform> params: vec4<f32>; // intensity, distortion, time, hazeStrength

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
    // Heat haze / distortion wobble when enabled
    if (params.y > 0.5 && params.w > 0.01) {
        let wobble = sin(uv.y * 40.0 + params.z * 8.0) * 0.002 * params.w
            + cos(uv.x * 30.0 - params.z * 6.0) * 0.0015 * params.w;
        uv = clamp(uv + vec2<f32>(wobble, wobble * 0.6), vec2<f32>(0.0), vec2<f32>(1.0));
    }

    let fx = textureSample(fxTex, samp, uv);
    let bloom = textureSample(bloomTex, samp, uv);
    let outRgb = fx.rgb + bloom.rgb * params.x;
    return vec4<f32>(outRgb, fx.a);
}
`;
