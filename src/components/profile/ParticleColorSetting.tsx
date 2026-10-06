import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_PARTICLE_COLOR, useParticleAppearance } from '../../context/ParticleAppearance';
import { CircularColorPicker } from './CircularColorPicker';
import './ProfileSettings.css';
export function ParticleColorSetting() {
  const { color, setColor } = useParticleAppearance();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <section className="particle-setting"><button ref={trigger} className="particle-setting-entry" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open}><span>颗粒颜色</span><span className="color-value"><i style={{ background: color }} />{color}</span><span className="adjust-label">调整 ›</span></button>
    {open && <ParticleColorPanel color={color} onChange={setColor} onClose={() => { setOpen(false); trigger.current?.focus(); }} />}
  </section>;
}
function ParticleColorPanel({ color, onChange, onClose }: { color: string; onChange: (color: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const previousOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    ref.current?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key === 'Tab') {
        const nodes = ref.current?.querySelectorAll<HTMLElement>('button, [tabindex="0"]'); if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', key);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', key); };
  }, []);
  return createPortal(<div className="color-panel-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div ref={ref} className="particle-color-dialog" role="dialog" aria-modal="true" aria-labelledby="color-panel-title" tabIndex={-1}>
    <div className="sheet-handle" /><div className="color-panel-heading"><h2 id="color-panel-title">颗粒颜色</h2><button aria-label="关闭颜色设置" onClick={onClose}>×</button></div>
    <div className="color-current"><span style={{ background: color }} /><strong>{color}</strong></div>
    <CircularColorPicker color={color} onChange={onChange} />
    <p className="color-helper">轻轻拖动，找到适合今天的颜色</p><div className="color-panel-footer"><button onClick={() => onChange(DEFAULT_PARTICLE_COLOR)}>恢复默认</button><button className="warm-primary" onClick={onClose}>完成</button></div>
  </div></div>, document.body);
}
