"use client";
import { useState } from "react";

const STEPS = [
  {
    id: "welcome",
    mood: "content",
    title: "Привет!",
    subtitle: "Я Фома — твой спутник в Форме",
    body: "Я живу здесь, и мне нужна твоя помощь. Каждая выполненная форма — это моя энергия.",
  },
  {
    id: "explain",
    mood: "happy",
    title: "Как это работает",
    subtitle: null,
    body: null,
    features: [
      { icon: "clock", text: "Формы — твои ежедневные практики" },
      { icon: "chart", text: "Каждая форма даёт очки и стрик" },
      { icon: "heart", text: "Чем лучше ты — тем счастливее Фома" },
    ],
  },
  {
    id: "name",
    mood: "happy",
    title: "Как тебя зовут?",
    subtitle: "Фома хочет познакомиться",
    body: null,
    input: true,
  },
];

const MOODS = {
  content: { eyeH: 10, eyeY: 42, mouthD: "M 40 56 Q 50 62 60 56", blush: true,  bodyColor: "#6B8F5E" },
  happy:   { eyeH: 10, eyeY: 42, mouthD: "M 38 56 Q 50 66 62 56", blush: true,  bodyColor: "#4A7C59" },
};

function FomaFace({ mood = "content", size = 160 }) {
  const m = MOODS[mood];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: "drop-shadow(0 6px 20px rgba(74,124,89,0.25))" }}>
      <ellipse cx="50" cy="54" rx="34" ry="36" fill={m.bodyColor} style={{ transition: "fill .6s" }} />
      <ellipse cx="50" cy="54" rx="34" ry="36" fill="url(#ob-hl)" opacity="0.3" />
      <ellipse cx="40" cy={m.eyeY} rx="4.5" ry={m.eyeH / 2} fill="#fff" style={{ transition: "all .4s" }} />
      <ellipse cx="60" cy={m.eyeY} rx="4.5" ry={m.eyeH / 2} fill="#fff" style={{ transition: "all .4s" }} />
      {m.eyeH > 5 && <>
        <circle cx="41" cy={m.eyeY + 1} r="2.2" fill="#1A1917" />
        <circle cx="61" cy={m.eyeY + 1} r="2.2" fill="#1A1917" />
        <circle cx="42.5" cy={m.eyeY - 1} r="0.9" fill="#fff" opacity="0.8" />
        <circle cx="62.5" cy={m.eyeY - 1} r="0.9" fill="#fff" opacity="0.8" />
      </>}
      {m.blush && <>
        <ellipse cx="30" cy="52" rx="5" ry="3" fill="#E8A0A0" opacity="0.35" />
        <ellipse cx="70" cy="52" rx="5" ry="3" fill="#E8A0A0" opacity="0.35" />
      </>}
      <path d={m.mouthD} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" style={{ transition: "all .4s" }} />
      <defs>
        <radialGradient id="ob-hl" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function FeatureIcon({ type }) {
  if (type === "clock") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  );
  if (type === "chart") return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
      <path d="M3 20h18M6 16v4M10 12v8M14 8v12M18 4v16" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (isLast) {
      onComplete(name.trim() || "Друг");
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 28px",
      animation: "bgFadeIn .4s ease",
    }}>
      {/* Progress dots */}
      <div style={{
        position: "absolute", top: 60,
        display: "flex", gap: 6,
      }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 20 : 6, height: 6,
            borderRadius: 3,
            background: i === step ? "var(--accent)" : "var(--surface3)",
            transition: "all .3s ease",
          }} />
        ))}
      </div>

      {/* Foma */}
      <div style={{
        marginBottom: 32,
        animation: "fomaBounce .6s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <FomaFace mood={current.mood} size={140} />
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: "var(--font-serif)", fontSize: 28,
        fontWeight: 400, fontStyle: "italic",
        color: "var(--txt)", textAlign: "center",
        marginBottom: 8, lineHeight: 1.2,
      }}>
        {current.title}
      </h1>

      {/* Subtitle */}
      {current.subtitle && (
        <p style={{
          fontSize: 15, color: "var(--txt2)",
          textAlign: "center", marginBottom: 20,
          lineHeight: 1.5,
        }}>
          {current.subtitle}
        </p>
      )}

      {/* Body text */}
      {current.body && (
        <p style={{
          fontSize: 14, color: "var(--txt2)",
          textAlign: "center", lineHeight: 1.7,
          maxWidth: 300, marginBottom: 24,
        }}>
          {current.body}
        </p>
      )}

      {/* Features list */}
      {current.features && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 12,
          width: "100%", maxWidth: 320, marginBottom: 24,
        }}>
          {current.features.map((f, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "14px 18px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-sm)",
              animation: `fadeUp .4s ease ${i * 0.1}s both`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <FeatureIcon type={f.icon} />
              </div>
              <span style={{ fontSize: 14, color: "var(--txt)", fontWeight: 500 }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Name input */}
      {current.input && (
        <div style={{ width: "100%", maxWidth: 300, marginBottom: 24 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Твоё имя"
            autoFocus
            style={{
              width: "100%", padding: "14px 18px",
              border: "1px solid var(--border2)",
              borderRadius: "var(--radius-sm)",
              background: "var(--surface)",
              color: "var(--txt)",
              fontSize: 16, fontWeight: 500,
              textAlign: "center",
              outline: "none",
              fontFamily: "var(--font)",
              transition: "border-color .2s",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "var(--green)"; }}
            onBlur={e => { e.currentTarget.style.borderColor = ""; }}
            onKeyDown={e => { if (e.key === "Enter" && name.trim()) next(); }}
          />
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={next}
        disabled={isLast && !name.trim()}
        style={{
          padding: "14px 32px",
          borderRadius: "var(--radius-sm)",
          border: "none",
          background: isLast ? "var(--green)" : "var(--txt)",
          color: "#fff",
          fontSize: 15, fontWeight: 600,
          cursor: (isLast && !name.trim()) ? "not-allowed" : "pointer",
          opacity: (isLast && !name.trim()) ? 0.4 : 1,
          display: "flex", alignItems: "center", gap: 8,
          transition: "all .2s",
          letterSpacing: 0.2,
        }}
      >
        {isLast ? "Начать с Фомой" : "Дальше"}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>

      {/* Skip */}
      {!isLast && (
        <button
          onClick={() => onComplete("Друг")}
          style={{
            marginTop: 16, background: "none", border: "none",
            color: "var(--txt3)", fontSize: 13, cursor: "pointer",
          }}
        >
          Пропустить
        </button>
      )}

      <style>{`
        @keyframes fomaBounce {
          0% { transform: scale(0.5) translateY(30px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
