import { getMarqueeHints } from "../../utils/actionEvaluator";
import { useState, useEffect, useRef } from "react";

interface Props {
  isFocused: boolean;
  hasInput: boolean;
}

export function ActionHintMarquee({ isFocused, hasInput }: Props) {
  const hints = getMarqueeHints();
  const displayText = "✨ 可以记录： " + hints.join(" · ") + " · ";
  const [offset, setOffset] = useState(0);
  const animRef = useRef<number>(0);
  const paused = isFocused || hasInput;

  useEffect(() => {
    if (paused) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setOffset((o) => o + dt * 0.035);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [paused]);

  return (
    <div className="eval-marquee">
      <div
        className="eval-marquee-track"
        style={{ transform: `translateX(-${offset % (displayText.length * 8)}px)` }}
      >
        <span className="eval-marquee-text">{displayText}</span>
      </div>
    </div>
  );
}
