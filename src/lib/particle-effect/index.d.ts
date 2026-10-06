export interface ParticleEffectInstance {
  readonly canvas: HTMLCanvasElement;
  destroy(): void;
  setColor(color: string): void;
  setOpacity(opacity: number): void;
}
export interface ParticleEffectOptions {
  particleColor?: string;
  opacity?: number;
}
export function createParticleEffect(container: HTMLElement, options?: ParticleEffectOptions): ParticleEffectInstance;
