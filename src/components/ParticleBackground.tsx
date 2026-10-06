import { useEffect, useRef } from 'react';
import { createParticleEffect, type ParticleEffectInstance } from '../lib/particle-effect/index.js';
import { useParticleAppearance, PARTICLE_OPACITY } from '../context/ParticleAppearance';
import './ParticleBackground.css';
export function ParticleBackground() {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<ParticleEffectInstance | null>(null);
  const { color } = useParticleAppearance();
  const initialColor = useRef(color);
  useEffect(() => {
    if (!container.current) return;
    try {
      const effect = createParticleEffect(container.current, { particleColor: initialColor.current, opacity: PARTICLE_OPACITY });
      instance.current = effect;
      return () => { instance.current = null; effect.destroy(); };
    } catch { console.warn('Particle background is unavailable in this browser.'); }
  }, []);
  useEffect(() => { instance.current?.setColor(color); }, [color]);
  return <div ref={container} className="particle-background" aria-hidden="true" data-color={color} />;
}
