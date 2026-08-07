/** Shared WGSL uniform struct used across FX shaders. */
export const UNIFORMS_STRUCT = `
struct Uniforms {
    time: f32,
    resolutionX: f32,
    resolutionY: f32,
    bloomIntensity: f32,
    distortionEnabled: f32,
    lightingQuality: f32,
    cameraX: f32,
    cameraY: f32,
}
`;
