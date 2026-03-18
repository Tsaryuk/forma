"use client";
import { useState, useEffect, useRef } from "react";

// ── Foma — the Forma mascot ──────────────────────────────
// States: happy (>80%), content (50-80%), sleepy (<50%), sad (broken)

const MOODS = {
  happy:   { eyeH: 10, eyeY: 42, mouthD: "M 38 56 Q 50 66 62 56", blush: true,  bodyColor: "#4A7C59" },
  content: { eyeH: 10, eyeY: 42, mouthD: "M 40 56 Q 50 62 60 56", blush: true,  bodyColor: "#6B8F5E" },
  sleepy:  { eyeH: 4,  eyeY: 45, mouthD: "M 42 57 Q 50 59 58 57", blush: false, bodyColor: "#9C9889" },
  sad:     { eyeH: 10, eyeY: 44, mouthD: "M 40 60 Q 50 54 60 60", blush: false, bodyColor: "#B94A48" },
};

function getMood(pct, hasBroken) {
  if (hasBroken) return "sad";
  if (pct >= 80) return "happy";
  if (pct >= 50) return "content";
  return "sleepy";
}

function getNeed(forms) {
  const pending = forms.filter(f => !f.checkedToday && f.type !== "meal");
  const mealPending = forms.filter(f => f.type === "meal" && !f.meals?.every(m => m.done));
  const all = [...pending, ...mealPending];
  if (all.length === 0) return null;
  return all[0];
}

function needPhrase(form) {
  if (!form) return "Все потребности закрыты!";
  const phrases = {
    time:     "Фоме нужен режим",
    duration: "Фома хочет развиваться",
    meal:     "Фома проголодался",
    boolean:  "Фома ждёт дисциплины",
    limit:    "Фома следит за расходами",
  };
  return phrases[form.type] || "Фома ждёт";
}

export default function Mascot({ pct = 0, forms = [], hasBroken = false }) {
  const mood = getMood(pct, hasBroken);
  const m = MOODS[mood];
  const need = getNeed(forms);
  const phrase = needPhrase(need);
  const allDone = !need;

  // Bounce animation on mood/pct change
  const [bounce, setBounce] = useState(false);
  const prevPct = useRef(pct);
  useEffect(() => {
    if (pct !== prevPct.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 600);
      prevPct.current = pct;
      return () => clearTimeout(t);
    }
  }, [pct]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 0 16px",
    }}>
      {/* Character */}
      <div style={{
        marginBottom: 14,
        animation: bounce
          ? "fomaJoy .6s cubic-bezier(.34,1.56,.64,1)"
          : "fomaBreathe 3.5s ease-in-out infinite",
      }}>
        <svg
          width="120" height="120" viewBox="0 0 100 100"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))" }}
        >
          {/* Body */}
          <ellipse cx="50" cy="54" rx="34" ry="36" fill={m.bodyColor}
            style={{ transition: "fill .6s ease" }} />
          <ellipse cx="50" cy="54" rx="34" ry="36" fill="url(#foma-highlight)" opacity="0.3" />

          {/* Eyes */}
          <ellipse cx="40" cy={m.eyeY} rx="4.5" ry={m.eyeH / 2} fill="#fff"
            style={{ transition: "all .4s ease" }} />
          <ellipse cx="60" cy={m.eyeY} rx="4.5" ry={m.eyeH / 2} fill="#fff"
            style={{ transition: "all .4s ease" }} />
          {m.eyeH > 5 && <>
            <circle cx="41" cy={m.eyeY + 1} r="2.2" fill="#1A1917" />
            <circle cx="61" cy={m.eyeY + 1} r="2.2" fill="#1A1917" />
            <circle cx="42.5" cy={m.eyeY - 1} r="0.9" fill="#fff" opacity="0.8" />
            <circle cx="62.5" cy={m.eyeY - 1} r="0.9" fill="#fff" opacity="0.8" />
          </>}

          {/* Blush */}
          {m.blush && <>
            <ellipse cx="30" cy="52" rx="5" ry="3" fill="#E8A0A0" opacity="0.35" />
            <ellipse cx="70" cy="52" rx="5" ry="3" fill="#E8A0A0" opacity="0.35" />
          </>}

          {/* Mouth */}
          <path d={m.mouthD} fill="none" stroke="#fff" strokeWidth="2.2"
            strokeLinecap="round" style={{ transition: "all .4s ease" }} />

          <defs>
            <radialGradient id="foma-highlight" cx="40%" cy="30%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>

      {/* Name */}
      <p style={{
        fontFamily: "var(--font-serif)", fontSize: 20,
        fontStyle: "italic", fontWeight: 400,
        color: "var(--txt)", marginBottom: 4,
      }}>
        Фома
      </p>

      {/* Need phrase */}
      <p style={{
        fontSize: 13, color: allDone ? "var(--green)" : "var(--txt2)",
        fontWeight: allDone ? 500 : 400,
        textAlign: "center", lineHeight: 1.4,
        maxWidth: 240,
      }}>
        {phrase}
      </p>

      <style>{`
        @keyframes fomaBreathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes fomaJoy {
          0% { transform: scale(1) translateY(0); }
          30% { transform: scale(1.12) translateY(-8px); }
          50% { transform: scale(0.95) translateY(0); }
          70% { transform: scale(1.05) translateY(-3px); }
          100% { transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
