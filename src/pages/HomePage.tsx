import { EnergyStatusCard } from "../components/EnergyStatusCard";
import { DailyActions } from "../components/DailyActions";
import { ActionRecords } from "../components/ActionRecords";
import { TimeTracker } from "../components/TimeTracker";
import { useEffect, useRef, useState } from "react";
import { ActionHintMarquee } from "../components/action/ActionHintMarquee";
import type { Task, DayStats, DailyTaskRecord, MinimalRecord } from "../storage";

interface HomePageProps {
  energy: string; setEnergy: (e: "low" | "normal" | "high") => void;
  level: number; currentLevelXp: number; progressPercent: number;
  todayStats: DayStats; streak: number; totalTasks: number;
  tasks: Task[]; toggleTask: (id: number) => void;
  dailyTaskRecords: Record<string, DailyTaskRecord[]>;
  doMinimalAction: (a: string) => void;
  input: string; setInput: (v: string) => void; addTask: () => void;
  todayRecords: MinimalRecord[]; deleteRecord: (id: number) => void;
  onEvaluateAction: (text: string) => void;
  isRunning: (t: string) => boolean; startTimer: (t: string) => void; stopTimer: (t: string) => void;
}

function fmtDate(): string {
  const d = new Date();
  const w = ["日","一","二","三","四","五","六"];
  return (d.getMonth()+1) + "月" + d.getDate() + "日 星期" + w[d.getDay()];
}

export function HomePage(p: HomePageProps) {
  const [evalInput, setEvalInput] = useState("");
  const [evalFocused, setEvalFocused] = useState(false);

  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceLoaded, setVoiceLoaded] = useState(false);
  const voiceAutoStartRef = useRef(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const voiceFrameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    function onVoiceMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "voice-asr-ready") {
        setVoiceReady(true);

        if (voiceAutoStartRef.current) {
          voiceAutoStartRef.current = false;

          const target = voiceFrameRef.current?.contentWindow;
          if (target) {
            target.postMessage({ type: "voice-asr-start" }, window.location.origin);
            setVoiceRecording(true);
          }
        }
      }

      if (event.data?.type === "voice-asr-result") {
        const text = String(event.data.text || "").trim();
        if (text) setEvalInput(text);
        setVoiceRecording(false);
      }
    }

    window.addEventListener("message", onVoiceMessage);
    return () => window.removeEventListener("message", onVoiceMessage);
  }, []);

  useEffect(() => {
    if (!voiceLoaded || voiceReady) return;

    const timer = window.setInterval(() => {
      try {
        const frameWindow = voiceFrameRef.current?.contentWindow as any;

        if (frameWindow?.__VOICE_ASR_READY__) {
          setVoiceReady(true);

          if (voiceAutoStartRef.current) {
            voiceAutoStartRef.current = false;
            frameWindow.postMessage(
              { type: "voice-asr-start" },
              window.location.origin
            );
            setVoiceRecording(true);
          }

          window.clearInterval(timer);
        }
      } catch {
        // Ignore transient iframe access errors while loading.
      }
    }, 300);

    return () => window.clearInterval(timer);
  }, [voiceLoaded, voiceReady]);

  function toggleVoice() {
    if (!voiceLoaded) {
      voiceAutoStartRef.current = true;
      setVoiceLoaded(true);
      return;
    }

    const target = voiceFrameRef.current?.contentWindow;
    if (!target || !voiceReady) return;

    if (voiceRecording) {
      target.postMessage({ type: "voice-asr-stop" }, window.location.origin);
    } else {
      target.postMessage({ type: "voice-asr-start" }, window.location.origin);
      setVoiceRecording(true);
    }
  }
  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-date">{fmtDate()}</div>
        <EnergyStatusCard energy={p.energy} onChange={p.setEnergy} />
        <div className="home-level-area">
          <span className="home-level-label">L E V E L</span>
          <div className="home-level-number">{p.level}</div>
          <div className="home-xp-bar">
            <div className="home-xp-track">
              <div className="home-xp-fill" style={{ width: Math.min(p.progressPercent, 100) + "%" }} />
            </div>
          </div>
          <div className="home-xp-text">{p.currentLevelXp} / 100 XP</div>
        </div>
        <div className="home-streak">🔥 {p.streak} 天连续</div>
      </header>

      <section className="eval-section">
        <h3 className="section-title">记录今日行动</h3>
        <ActionHintMarquee isFocused={evalFocused} hasInput={evalInput.length > 0} />
        <div className="eval-input-row">
          <input
            type="text"
            className="eval-input"
            placeholder="今天完成了什么？"
            value={evalInput}
            onChange={(e) => setEvalInput(e.target.value)}
            onFocus={() => setEvalFocused(true)}
            onBlur={() => setEvalFocused(false)}
            onKeyDown={(e) => { if (e.key === "Enter" && evalInput.trim()) { p.onEvaluateAction(evalInput.trim()); setEvalInput(""); } }}
          />
          <button
  type="button"
  className={"eval-voice-btn" + (voiceRecording ? " recording" : "")}
  title={
    !voiceLoaded
      ? "加载语音模型"
      : !voiceReady
        ? "语音模型加载中"
        : voiceRecording
          ? "停止录音并识别"
          : "开始语音输入"
  }
  disabled={voiceLoaded && !voiceReady}
  onClick={toggleVoice}
>
  {voiceRecording ? "正在听…" : !voiceLoaded ? "🎙️" : !voiceReady ? "加载中…" : "🎙️"}
</button>

{voiceLoaded && (
  <div
    style={{
      position: "fixed",
      width: "360px",
      height: "180px",
      right: voiceReady ? "8px" : "50%",
      bottom: voiceReady ? "8px" : "24px",
      transform: voiceReady ? "none" : "translateX(50%)",
      zIndex: voiceReady ? -1 : 9999,
      borderRadius: "18px",
      overflow: "hidden",
      opacity: voiceReady ? 0.01 : 1,
      pointerEvents: voiceReady ? "none" : "auto"
    }}
  >
    <iframe
      ref={voiceFrameRef}
      src={`${import.meta.env.BASE_URL}voice-asr/index.html`}
      title="本地语音识别"
      style={{
        width: "100%",
        height: "100%",
        border: 0
      }}
    />

    {!voiceReady && (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(247, 243, 236, 0.98)",
          color: "#8b755d",
          fontSize: "15px",
          letterSpacing: "0.08em",
          pointerEvents: "none"
        }}
      >
        语音模型准备中…
      </div>
    )}
  </div>
)}
          <button
            className="eval-submit-btn"
            disabled={!evalInput.trim()}
            onClick={() => { if (evalInput.trim()) { p.onEvaluateAction(evalInput.trim()); setEvalInput(""); } }}
          >
            行动评估
          </button>
        </div>
      </section>

      <section className="home-quick">
        <h3 className="section-title">快速操作</h3>
        <DailyActions onClick={p.doMinimalAction} />
        <ActionRecords records={p.todayRecords} onDelete={p.deleteRecord} />
        <TimeTracker timeMinutes={p.todayStats.timeMinutes} isRunning={p.isRunning} onStart={p.startTimer} onStop={p.stopTimer} />
      </section>
    </div>
  );
}