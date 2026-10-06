import { createContext, useContext, useState, type ReactNode } from 'react';
export const DEFAULT_PARTICLE_COLOR = '#DBD5BD';
export const PARTICLE_OPACITY = 0.48;
const Appearance = createContext({ color: DEFAULT_PARTICLE_COLOR, setColor: (_: string) => {} });
export function ParticleAppearanceProvider({ children }: { children: ReactNode }) {
  const [color, update] = useState(() => {
    try { const saved = localStorage.getItem('particleColor'); return saved && /^#[\da-f]{6}$/i.test(saved) ? saved.toUpperCase() : DEFAULT_PARTICLE_COLOR; }
    catch { return DEFAULT_PARTICLE_COLOR; }
  });
  function setColor(value: string) {
    if (!/^#[\da-f]{6}$/i.test(value)) return;
    update(value.toUpperCase());
    try { localStorage.setItem('particleColor', value.toUpperCase()); } catch { /* Preview remains available. */ }
  }
  return <Appearance.Provider value={{ color, setColor }}>{children}</Appearance.Provider>;
}
export const useParticleAppearance = () => useContext(Appearance);
