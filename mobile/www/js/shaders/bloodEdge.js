export const BLOOD_EDGE_SHADER = `
struct BloodUniforms {
    time: f32,
    resolutionX: f32,
    resolutionY: f32,
    healthRatio: f32,
    damagePulse: f32,
    enabled: f32,
}

@group(0) @binding(0) var<uniform> blood: BloodUniforms;

struct VSOut {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertexIndex: u32) -> VSOut {
    var pos = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );
    var xy = pos[vertexIndex];
    var out: VSOut;
    out.position = vec4<f32>(xy, 0.0, 1.0);
    out.uv = vec2<f32>(xy.x * 0.5 + 0.5, 0.5 - xy.y * 0.5);
    return out;
}

fn hash21(p: vec2<f32>) -> f32 {
    var p3 = fract(vec3<f32>(p.x, p.y, p.x) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

fn noise2(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let a = hash21(i);
    let b = hash21(i + vec2<f32>(1.0, 0.0));
    let c = hash21(i + vec2<f32>(0.0, 1.0));
    let d = hash21(i + vec2<f32>(1.0, 1.0));
    let u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

fn fbm(p: vec2<f32>) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
    var pos = p;
    for (var i = 0; i < 4; i++) {
        value += amplitude * noise2(pos);
        pos = pos * 2.05 + vec2<f32>(17.3, 9.2);
        amplitude *= 0.5;
    }
    return value;
}

@fragment
fn fs_main(input: VSOut) -> @location(0) vec4<f32> {
    if (blood.enabled < 0.5) {
        discard;
    }

    let uv = input.uv;
    let res = vec2<f32>(blood.resolutionX, blood.resolutionY);
    let px = min(min(uv.x, 1.0 - uv.x) * res.x, min(uv.y, 1.0 - uv.y) * res.y);

    let injury = clamp((1.0 - blood.healthRatio) * 0.75 + blood.damagePulse * 0.85, 0.0, 1.0);
    if (injury < 0.02) {
        discard;
    }

    let band = 28.0 + injury * 140.0;
    var edgeMask = 1.0 - smoothstep(0.0, band, px);

    let corner = vec2<f32>(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    let cornerDist = length(corner);
    let cornerBoost = 1.0 - smoothstep(0.0, 0.22, cornerDist);
    edgeMask = clamp(edgeMask + cornerBoost * injury * 0.55, 0.0, 1.0);

    let topDist = uv.y * res.y;
    let dripCoord = vec2<f32>(uv.x * res.x * 0.018 + blood.time * 0.04, topDist * 0.012 - blood.time * 0.55);
    let dripNoise = fbm(dripCoord);
    let dripStreaks = fbm(vec2<f32>(uv.x * 42.0, uv.y * 6.0 - blood.time * 1.1));
    let topDrip = (1.0 - smoothstep(0.0, band * 1.6, topDist)) * (0.45 + dripNoise * 0.55) * (0.35 + dripStreaks * 0.65);

    let sideDist = min(uv.x, 1.0 - uv.x) * res.x;
    var sideSmear = (1.0 - smoothstep(0.0, band * 0.85, sideDist));
    sideSmear *= 0.5 + fbm(vec2<f32>(uv.y * 8.0 + blood.time * 0.2, uv.x * 30.0)) * 0.5;

    var pattern = edgeMask * 0.55 + topDrip * 0.35 + sideSmear * 0.25;
    pattern *= 0.65 + fbm(vec2<f32>(uv.x * 24.0, uv.y * 18.0 + blood.time * 0.15)) * 0.35;
    pattern += blood.damagePulse * (1.0 - smoothstep(0.0, band * 2.0, px)) * 0.45;

    let alpha = clamp(pattern * injury * 0.92, 0.0, 0.95);
    if (alpha < 0.008) {
        discard;
    }

    let wet = fbm(vec2<f32>(uv.x * 60.0, uv.y * 40.0));
    let bloodDark = vec3<f32>(0.22, 0.01, 0.02);
    let bloodMid = vec3<f32>(0.55, 0.03, 0.05);
    let bloodHot = vec3<f32>(0.82, 0.08, 0.06);
    var color = mix(bloodDark, bloodMid, wet);
    color = mix(color, bloodHot, blood.damagePulse * 0.35 + topDrip * 0.2);

    return vec4<f32>(color * alpha, alpha);
}
`;
