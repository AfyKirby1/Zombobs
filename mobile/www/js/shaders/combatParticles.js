import { UNIFORMS_STRUCT } from './uniforms.js';

/** GPU combat particle compute + render. Particle: pos(2), vel(2), rgba(4), radius, life, maxLife, kind = 12 floats. */
export const COMBAT_PARTICLE_COMPUTE = `
struct CombatParticle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    color: vec4<f32>,
    radius: f32,
    life: f32,
    maxLife: f32,
    kind: f32,
}

@group(0) @binding(0) var<uniform> dtPad: vec4<f32>; // dt, count, unused, unused
@group(0) @binding(1) var<storage, read_write> particles: array<CombatParticle>;

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) id: vec3<u32>) {
    let i = id.x;
    let count = u32(dtPad.y);
    if (i >= count) { return; }
    var p = particles[i];
    if (p.life <= 0.0) { return; }

    let dt = dtPad.x;
    var drag = 0.98;
    var gravity = 0.0;
    // smoke floats up, debris falls slightly
    if (p.kind > 1.5 && p.kind < 2.5) {
        drag = 0.96;
        gravity = -0.04;
    } else if (p.kind > 3.5 && p.kind < 4.5) {
        drag = 0.97;
        gravity = 0.08;
    } else if (p.kind > 2.5 && p.kind < 3.5) {
        drag = 0.95;
        gravity = -0.06;
    }

    p.vel = p.vel * drag;
    p.vel.y = p.vel.y + gravity;
    p.pos = p.pos + p.vel * (dt * 60.0);
    p.life = p.life - dt * 60.0;
    particles[i] = p;
}
`;

export const COMBAT_PARTICLE_RENDER = `
${UNIFORMS_STRUCT}

struct CombatParticle {
    pos: vec2<f32>,
    vel: vec2<f32>,
    color: vec4<f32>,
    radius: f32,
    life: f32,
    maxLife: f32,
    kind: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> particles: array<CombatParticle>;

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
    let p = particles[particleIndex];

    var alpha = 0.0;
    if (p.maxLife > 0.0 && p.life > 0.0) {
        alpha = p.color.a * clamp(p.life / p.maxLife, 0.0, 1.0);
    }

    let size = max(p.radius * 2.0, 4.0);
    var quadPos = vec2<f32>(0.0, 0.0);
    var uv = vec2<f32>(0.0, 0.0);
    if (quadVertex == 0u) { quadPos = vec2<f32>(-1.0, 1.0); uv = vec2<f32>(0.0, 0.0); }
    else if (quadVertex == 1u) { quadPos = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); }
    else if (quadVertex == 2u) { quadPos = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); }
    else if (quadVertex == 3u) { quadPos = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); }
    else if (quadVertex == 4u) { quadPos = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); }
    else { quadPos = vec2<f32>(1.0, -1.0); uv = vec2<f32>(1.0, 1.0); }

    let screenX = p.pos.x - uniforms.cameraX;
    let screenY = p.pos.y - uniforms.cameraY;
    let ndcX = (screenX / uniforms.resolutionX) * 2.0 - 1.0;
    let ndcY = (screenY / uniforms.resolutionY) * -2.0 + 1.0;
    let scaleX = (size / uniforms.resolutionX) * 2.0;
    let scaleY = (size / uniforms.resolutionY) * 2.0;

    var out: VSOut;
    out.position = vec4<f32>(ndcX + quadPos.x * scaleX, ndcY + quadPos.y * scaleY, 0.0, 1.0);
    out.color = vec4<f32>(p.color.rgb, alpha);
    out.uv = uv;
    out.kind = p.kind;
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    if (input.color.a < 0.01) { discard; }
    let dist = distance(input.uv, vec2<f32>(0.5));
    var softStart = 0.25;
    var softEnd = 0.5;
    if (input.kind > 4.5 && input.kind < 5.5) {
        softStart = 0.35;
        softEnd = 0.48;
    }
    let alpha = input.color.a * (1.0 - smoothstep(softStart, softEnd, dist));
    return vec4<f32>(input.color.rgb, alpha);
}
`;
