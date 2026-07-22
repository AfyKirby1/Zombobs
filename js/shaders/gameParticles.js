import { UNIFORMS_STRUCT } from './uniforms.js';

/** Soft billboard game particles. Stride: x,y,r,g,b,a,radius,kind (8 floats). */
export const GAME_PARTICLE_SHADER = `
${UNIFORMS_STRUCT}
@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> particleData: array<f32>;

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) uv: vec2<f32>,
    @location(2) kind: f32,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexId: u32) -> VSOut {
    let particleIndex = vertexId / 6u;
    let quadVertex = vertexId % 6u;

    let idx = particleIndex * 8u;
    let x = particleData[idx + 0u];
    let y = particleData[idx + 1u];
    let r = particleData[idx + 2u];
    let g = particleData[idx + 3u];
    let b = particleData[idx + 4u];
    let a = particleData[idx + 5u];
    let radius = particleData[idx + 6u];
    let kind = particleData[idx + 7u];

    let baseSize = radius * 2.0;
    let size = select(10.0, baseSize, baseSize > 10.0);

    var quadPos = vec2<f32>(0.0, 0.0);
    var uv = vec2<f32>(0.0, 0.0);
    if (quadVertex == 0u) { quadPos = vec2<f32>(-1.0, 1.0); uv = vec2<f32>(0.0, 0.0); }
    else if (quadVertex == 1u) { quadPos = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); }
    else if (quadVertex == 2u) { quadPos = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); }
    else if (quadVertex == 3u) { quadPos = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); }
    else if (quadVertex == 4u) { quadPos = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); }
    else { quadPos = vec2<f32>(1.0, -1.0); uv = vec2<f32>(1.0, 1.0); }

    let screenX = x - uniforms.cameraX;
    let screenY = y - uniforms.cameraY;
    let ndcX = (screenX / uniforms.resolutionX) * 2.0 - 1.0;
    let ndcY = (screenY / uniforms.resolutionY) * -2.0 + 1.0;
    let scaleX = (size / uniforms.resolutionX) * 2.0;
    let scaleY = (size / uniforms.resolutionY) * 2.0;

    var out: VSOut;
    out.position = vec4<f32>(
        ndcX + quadPos.x * scaleX,
        ndcY + quadPos.y * scaleY,
        0.0,
        1.0
    );
    out.color = vec4<f32>(r, g, b, a);
    out.uv = uv;
    out.kind = kind;
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    let center = vec2<f32>(0.5, 0.5);
    let dist = distance(input.uv, center);
    // kind: 0 spark, 1 blood, 2 smoke, 3 fire, 4 debris, 5 flash, 6 shockwave, 7 snow, 8 muzzle, 9 ember
    var softStart = 0.3;
    var softEnd = 0.5;
    if (input.kind > 1.5 && input.kind < 2.5) {
        softStart = 0.15;
        softEnd = 0.55;
    } else if (input.kind > 4.5 && input.kind < 5.5) {
        softStart = 0.35;
        softEnd = 0.48;
    } else if (input.kind > 2.5 && input.kind < 3.5) {
        softStart = 0.2;
        softEnd = 0.52;
    }
    let alpha = input.color.a * (1.0 - smoothstep(softStart, softEnd, dist));
    return vec4<f32>(input.color.rgb, alpha);
}
`;
