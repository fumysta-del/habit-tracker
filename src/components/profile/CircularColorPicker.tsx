import { useEffect, useRef, useState, type PointerEvent } from 'react';
type HSV = { h: number; s: number; v: number };
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function rgb({ h, s, v }: HSV) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))); };
  return [f(5), f(3), f(1)];
}
const toHex = (value: HSV) => '#' + rgb(value).map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
function fromHex(hex: string): HSV {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const v = Math.max(r, g, b), d = v - Math.min(r, g, b);
  let h = d === 0 ? 0 : v === r ? ((g - b) / d) % 6 : v === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s: v === 0 ? 0 : d / v, v };
}
// Each circular scanline maps its full width to saturation 0–1.
function diskColor(x: number, y: number, h: number): HSV {
  const length = Math.hypot(x, y); if (length > 1) { x /= length; y /= length; }
  return { h, s: clamp((x / Math.max(0.0001, Math.sqrt(1 - y * y)) + 1) / 2), v: clamp((1 - y) / 2) };
}
export function CircularColorPicker({ color, onChange }: { color: string; onChange: (color: string) => void }) {
  const [hsv, setHSV] = useState(() => fromHex(color));
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => { setHSV(previous => toHex(previous) === color ? previous : fromHex(color)); }, [color]);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    const size = 240, pixels = ctx.createImageData(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = (x + .5 - size / 2) / (size / 2), dy = (y + .5 - size / 2) / (size / 2), offset = (y * size + x) * 4;
      if (dx * dx + dy * dy > 1) continue;
      const channels = rgb(diskColor(dx, dy, hsv.h));
      pixels.data.set([...channels, 255], offset);
    }
    ctx.putImageData(pixels, 0, 0);
  }, [hsv.h]);
  function change(value: HSV) { setHSV(value); onChange(toHex(value)); }
  function pointer(e: PointerEvent<HTMLDivElement>, ring: boolean) {
    if (e.type === 'pointermove' && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    if (e.type === 'pointerdown') { e.currentTarget.setPointerCapture(e.pointerId); e.currentTarget.focus(); }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2), y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    change(ring ? { ...hsv, h: (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360 } : diskColor(x, y, hsv.h));
  }
  const y = 1 - 2 * hsv.v, x = (2 * hsv.s - 1) * Math.sqrt(1 - y * y);
  return <div className="circular-picker">
    <div className="hue-ring" role="slider" aria-label="色相" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hsv.h)} tabIndex={0} onPointerDown={e => pointer(e, true)} onPointerMove={e => pointer(e, true)} onKeyDown={e => { if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp'].includes(e.key)) { e.preventDefault(); change({ ...hsv, h: (hsv.h + (['ArrowRight', 'ArrowUp'].includes(e.key) ? 1 : 359)) % 360 }); } }}>
      <span className="color-thumb hue-thumb" style={{ left: `${50 + 44 * Math.sin(hsv.h * Math.PI / 180)}%`, top: `${50 - 44 * Math.cos(hsv.h * Math.PI / 180)}%`, background: `hsl(${hsv.h} 100% 50%)` }} />
    </div>
    <div className="sv-disk" role="slider" aria-label="饱和度与明度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(hsv.s * 100)} aria-valuetext={`饱和度 ${Math.round(hsv.s * 100)}%，明度 ${Math.round(hsv.v * 100)}%；左右调整饱和度，上下调整明度`} tabIndex={0} onPointerDown={e => pointer(e, false)} onPointerMove={e => pointer(e, false)} onKeyDown={e => { if (e.key.startsWith('Arrow')) { e.preventDefault(); change({ ...hsv, s: clamp(hsv.s + (e.key === 'ArrowRight' ? .01 : e.key === 'ArrowLeft' ? -.01 : 0)), v: clamp(hsv.v + (e.key === 'ArrowUp' ? .01 : e.key === 'ArrowDown' ? -.01 : 0)) }); } }}>
      <canvas ref={canvas} width={240} height={240} aria-hidden="true" /><span className="color-thumb" style={{ left: `${50 + x * 50}%`, top: `${50 + y * 50}%`, background: color }} />
    </div>
  </div>;
}
