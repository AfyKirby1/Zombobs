import { UNIFORMS_STRUCT } from './uniforms.js';

export const FLASHLIGHT_SHADER = `
${UNIFORMS_STRUCT}

struct Flashlight {
    pos: vec2<f32>,
    angle: f32,
    isActive: f32,
}

struct Zombie {
    pos: vec2<f32>,
    radius: f32,
    padding: f32,
}

struct ZombieBuffer {
    count: f32,
    padding: vec3<f32>,
    data: array<Zombie>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> flashlight: Flashlight;
@group(0) @binding(2) var<storage, read> zombies: ZombieBuffer;

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
    @location(1) worldPos: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) VertexIndex: u32) -> VSOut {
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );
    var xy = pos[VertexIndex];
    var out: VSOut;
    out.position = vec4<f32>(xy, 0.0, 1.0);
    out.uv = vec2<f32>(xy.x * 0.5 + 0.5, 0.5 - xy.y * 0.5);
    let camera = vec2<f32>(uniforms.cameraX, uniforms.cameraY);
    let resolution = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
    out.worldPos = camera + (out.uv * resolution);
    return out;
}

@fragment
fn fs_main(in: VSOut) -> @location(0) vec4<f32> {
    if (flashlight.isActive < 0.5) {
        discard;
    }

    let camera = vec2<f32>(uniforms.cameraX, uniforms.cameraY);
    let resolution = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
    let worldPos = camera + (in.uv * resolution);

    let toLight = worldPos - flashlight.pos;
    let dist = length(toLight);
    let dir = normalize(toLight);

    let lightDir = vec2<f32>(cos(flashlight.angle), sin(flashlight.angle));
    let angleCos = dot(dir, lightDir);

    let coneWidth = 0.8;
    let smoothWidth = 0.1;
    let cone = smoothstep(coneWidth, coneWidth + smoothWidth, angleCos);

    let range = 450.0;
    let falloff = 1.0 - smoothstep(0.0, range, dist);

    var intensity = cone * falloff;
    let noise = sin(worldPos.x * 0.02 + uniforms.time * 2.0) * sin(worldPos.y * 0.02 - uniforms.time) * 0.1 + 0.9;
    intensity *= noise;

    if (intensity <= 0.01) {
        discard;
    }

    var color = vec3<f32>(1.0, 0.98, 0.9);
    var alpha = intensity * 0.4;

    var specular = 0.0;
    let numZombies = min(u32(zombies.count), 100u);

    for (var i = 0u; i < numZombies; i++) {
        let z = zombies.data[i];
        let toZombie = worldPos - z.pos;
        let zDist = length(toZombie);

        if (zDist < z.radius) {
            let zNormXY = toZombie / z.radius;
            let zHeight = sqrt(max(0.0, 1.0 - dot(zNormXY, zNormXY)));
            let normal = vec3<f32>(zNormXY.x, zNormXY.y, zHeight);
            let lightDir3D = normalize(vec3<f32>(toLight.x, toLight.y, -30.0));
            let viewDir = vec3<f32>(0.0, 0.0, 1.0);
            let halfDir = normalize(lightDir3D + viewDir);
            let specAngle = max(dot(normal, halfDir), 0.0);
            let spec = pow(specAngle, 20.0);
            specular += spec * intensity * 3.0;
        }
    }

    let specColor = vec3<f32>(0.8, 0.9, 1.0) * specular;
    return vec4<f32>(color * alpha + specColor, alpha + specular);
}
`;
