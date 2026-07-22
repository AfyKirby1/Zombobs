/** ZombobsFX spore-cloud compute + render WGSL. */
export const ZOMBOBS_FX_SHADER = `
struct Particle {
    pos : vec2<f32>,
    vel : vec2<f32>,
    life : f32,
    padding : f32,
};

struct SimParams {
    deltaTime : f32,
    cursorX : f32,
    cursorY : f32,
    repelStrength : f32,
};

@group(0) @binding(0) var<uniform> params : SimParams;
@group(0) @binding(1) var<storage, read_write> particlesA : array<Particle>;
@group(0) @binding(2) var<storage, read_write> particlesB : array<Particle>;

@group(1) @binding(0) var<uniform> renderParams : SimParams;
@group(1) @binding(1) var<storage, read> renderParticles : array<Particle>;

fn rand(n: vec2<f32>) -> f32 {
    return fract(sin(dot(n, vec2<f32>(12.9898, 4.1414))) * 43758.5453);
}

@compute @workgroup_size(64)
fn simulate(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
    let index = GlobalInvocationID.x;
    if (index >= arrayLength(&particlesA)) { return; }

    var p = particlesA[index];

    let angle = rand(p.pos * 0.1) * 6.28;
    let flow = vec2<f32>(cos(angle), sin(angle)) * 0.002;

    let dx = p.pos.x - params.cursorX;
    let dy = p.pos.y - params.cursorY;
    let dist = sqrt(dx*dx + dy*dy);
    var repel = vec2<f32>(0.0, 0.0);

    if (dist < 0.3) {
        let force = (0.3 - dist) * params.repelStrength;
        repel = normalize(vec2<f32>(dx, dy)) * force * 0.05;
    }

    p.vel = p.vel * 0.96 + flow + repel;
    p.pos = p.pos + p.vel;

    if (p.pos.x < -1.0) { p.pos.x = 1.0; }
    if (p.pos.x > 1.0) { p.pos.x = -1.0; }
    if (p.pos.y < -1.0) { p.pos.y = 1.0; }
    if (p.pos.y > 1.0) { p.pos.y = -1.0; }

    p.life = p.life - 0.001;
    if (p.life < 0.0) {
        p.life = 1.0;
        p.pos = vec2<f32>(
            rand(vec2<f32>(f32(index), p.vel.x))*2.0 - 1.0,
            rand(vec2<f32>(p.vel.y, f32(index)))*2.0 - 1.0
        );
    }

    particlesB[index] = p;
}

struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) color : vec4<f32>,
    @location(1) uv : vec2<f32>,
};

@vertex
fn vs_main(
    @builtin(vertex_index) vIndex : u32,
    @builtin(instance_index) iIndex : u32,
) -> VertexOutput {
    var pos_vertex = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );

    let particle = renderParticles[iIndex];
    let vertex_pos = pos_vertex[vIndex] * 0.005;

    var output : VertexOutput;
    output.Position = vec4<f32>(particle.pos + vertex_pos, 0.0, 1.0);
    output.uv = pos_vertex[vIndex];

    let lifeFactor = particle.life;
    let toxicGreen = vec3<f32>(0.2, 1.0, 0.1);
    let zombiePurple = vec3<f32>(0.6, 0.0, 0.8);
    output.color = vec4<f32>(mix(zombiePurple, toxicGreen, lifeFactor), lifeFactor * 0.2);
    return output;
}

@fragment
fn fs_main(@location(0) color : vec4<f32>, @location(1) uv : vec2<f32>) -> @location(0) vec4<f32> {
    let dist = length(uv);
    if (dist > 1.0) { discard; }
    let alpha = (1.0 - dist) * color.a;
    return vec4<f32>(color.rgb, alpha);
}
`;
