import { UNIFORMS_STRUCT } from './uniforms.js';

/** Camera-anchored blood grid render + optional compute diffusion. */
export const BLOOD_GRID_COMPUTE = `
struct BloodCell {
    height: f32,
    viscosity: f32,
    worldX: f32,
    worldY: f32,
}

@group(0) @binding(0) var<uniform> params: vec4<f32>; // width, height, cellSize, evaporate
@group(0) @binding(1) var<storage, read> src: array<BloodCell>;
@group(0) @binding(2) var<storage, read_write> dst: array<BloodCell>;

@compute @workgroup_size(8, 8)
fn diffuse(@builtin(global_invocation_id) id: vec3<u32>) {
    let w = u32(params.x);
    let h = u32(params.y);
    if (id.x >= w || id.y >= h) { return; }
    let idx = id.y * w + id.x;
    var cell = src[idx];

    var neighborH = 0.0;
    var nCount = 0.0;
    if (id.x > 0u) { neighborH += src[idx - 1u].height; nCount += 1.0; }
    if (id.x + 1u < w) { neighborH += src[idx + 1u].height; nCount += 1.0; }
    if (id.y > 0u) { neighborH += src[idx - w].height; nCount += 1.0; }
    if (id.y + 1u < h) { neighborH += src[idx + w].height; nCount += 1.0; }

    if (nCount > 0.0 && cell.height > 0.01) {
        let avg = neighborH / nCount;
        let flow = (avg - cell.height) * 0.15 * (1.0 - cell.viscosity * 0.5);
        cell.height = clamp(cell.height + flow, 0.0, 1.0);
    }

    cell.height = cell.height * params.w; // evaporate
    if (cell.height < 0.002) {
        cell.height = 0.0;
        cell.viscosity = 0.8;
    } else {
        cell.viscosity = max(0.2, cell.viscosity - 0.001);
    }
    dst[idx] = cell;
}
`;

export const BLOOD_GRID_RENDER = `
${UNIFORMS_STRUCT}

struct BloodCell {
    height: f32,
    viscosity: f32,
    worldX: f32,
    worldY: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> cells: array<BloodCell>;
@group(0) @binding(2) var<uniform> gridParams: vec4<f32>; // width, height, cellSize, count

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) alpha: f32,
    @location(1) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexId: u32) -> VSOut {
    let cellIndex = vertexId / 6u;
    let quadVertex = vertexId % 6u;
    let cell = cells[cellIndex];

    var alpha = 0.0;
    if (cell.height > 0.01) {
        alpha = clamp(cell.height * 0.85, 0.0, 0.9);
    }

    let size = gridParams.z * (0.6 + cell.height * 0.8);
    var quadPos = vec2<f32>(0.0, 0.0);
    var uv = vec2<f32>(0.0, 0.0);
    if (quadVertex == 0u) { quadPos = vec2<f32>(-1.0, 1.0); uv = vec2<f32>(0.0, 0.0); }
    else if (quadVertex == 1u) { quadPos = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); }
    else if (quadVertex == 2u) { quadPos = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); }
    else if (quadVertex == 3u) { quadPos = vec2<f32>(1.0, 1.0); uv = vec2<f32>(1.0, 0.0); }
    else if (quadVertex == 4u) { quadPos = vec2<f32>(-1.0, -1.0); uv = vec2<f32>(0.0, 1.0); }
    else { quadPos = vec2<f32>(1.0, -1.0); uv = vec2<f32>(1.0, 1.0); }

    let screenX = cell.worldX - uniforms.cameraX;
    let screenY = cell.worldY - uniforms.cameraY;
    let ndcX = (screenX / uniforms.resolutionX) * 2.0 - 1.0;
    let ndcY = (screenY / uniforms.resolutionY) * -2.0 + 1.0;
    let scaleX = (size / uniforms.resolutionX) * 2.0;
    let scaleY = (size / uniforms.resolutionY) * 2.0;

    var out: VSOut;
    out.position = vec4<f32>(ndcX + quadPos.x * scaleX, ndcY + quadPos.y * scaleY, 0.0, 1.0);
    out.alpha = alpha;
    out.uv = uv;
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    if (input.alpha < 0.01) { discard; }
    let dist = distance(input.uv, vec2<f32>(0.5));
    let a = input.alpha * (1.0 - smoothstep(0.25, 0.5, dist));
    return vec4<f32>(0.45, 0.02, 0.04, a);
}
`;

/** Additive point lights (muzzle/explosion/fire). */
export const POINT_LIGHTS_SHADER = `
${UNIFORMS_STRUCT}

struct Light {
    pos: vec2<f32>,
    radius: f32,
    intensity: f32,
    color: vec3<f32>,
    padding: f32,
}

struct LightBuffer {
    count: f32,
    padding: vec3<f32>,
    data: array<Light, 16>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<uniform> lights: LightBuffer;

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vi: u32) -> VSOut {
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );
    var xy = pos[vi];
    var out: VSOut;
    out.position = vec4<f32>(xy, 0.0, 1.0);
    out.uv = vec2<f32>(xy.x * 0.5 + 0.5, 0.5 - xy.y * 0.5);
    return out;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    let camera = vec2<f32>(uniforms.cameraX, uniforms.cameraY);
    let resolution = vec2<f32>(uniforms.resolutionX, uniforms.resolutionY);
    let worldPos = camera + input.uv * resolution;

    var color = vec3<f32>(0.0);
    var alpha = 0.0;
    let count = min(u32(lights.count), 16u);
    for (var i = 0u; i < count; i++) {
        let L = lights.data[i];
        let d = distance(worldPos, L.pos);
        let falloff = 1.0 - smoothstep(0.0, L.radius, d);
        let contrib = falloff * falloff * L.intensity;
        color += L.color * contrib;
        alpha += contrib * 0.35;
    }
    if (alpha < 0.01) { discard; }
    return vec4<f32>(color * alpha, clamp(alpha, 0.0, 0.85));
}
`;
