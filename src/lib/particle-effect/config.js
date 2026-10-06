/** Accepted defaults. Shader constants are documented here, not user controls. */
export const defaultConfig = Object.freeze({
  pixelSize: 8,
  fieldScale: 36,
  stopAfter: 1500,
  cursorColor: Object.freeze([249, 244, 235]),
  shaderConstants: Object.freeze({ radius: 0.04, strength: 0.04, decayTime: 250, maxDecay: 0.5 }),
});
