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

// ── Sparkle particles for allDone ────────────────────────
function Sparkles() {
  return (
    <g className="foma-sparkles">
      {[
        { cx: 18, cy: 22, d: 0 },
        { cx: 82, cy: 20, d: 0.3 },
        { cx: 12, cy: 58, d: 0.6 },
        { cx: 88, cy: 55, d: 0.9 },
        { cx: 50, cy: 12, d: 0.15 },
        { cx: 30, cy: 16, d: 0.45 },
        { cx: 70, cy: 14, d: 0.75 },
      ].map((s, i) => (
        <g key={i} style={{ animation: `fomaSparkle 2s ease-in-out ${s.d}s infinite` }}>
          <line x1={s.cx - 3} y1={s.cy} x2={s.cx + 3} y2={s.cy} stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={s.cx} y1={s.cy - 3} x2={s.cx} y2={s.cy + 3} stroke="#FFD700" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
}

export default function Mascot({ pct = 0, forms = [], hasBroken = false }) {
  const mood = getMood(pct, hasBroken);
  const m = MOODS[mood];
  const need = getNeed(forms);
  const phrase = needPhrase(need);
  const allDone = !need;

  // Bounce animation on pct change
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

  // Blinking
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    function scheduleBlink() {
      const delay = 2500 + Math.random() * 3500;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        timerRef.current = scheduleBlink();
      }, delay);
    }
    const timerRef = { current: null };
    timerRef.current = scheduleBlink();
    return () => clearTimeout(timerRef.current);
  }, []);

  // Pupil look direction (subtle random movement)
  const [look, setLook] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      setLook({
        x: (Math.random() - 0.5) * 2.5,
        y: (Math.random() - 0.5) * 1.5,
      });
    }, 2000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const eyeScale = blink ? 0.1 : 1;
  const isSleepy = mood === "sleepy";
  const isSad = mood === "sad";

  // Body animation class
  let bodyAnim = "fomaBreathe 3.5s ease-in-out infinite";
  if (bounce) bodyAnim = "fomaJoy .6s cubic-bezier(.34,1.56,.64,1)";
  else if (allDone) bodyAnim = "fomaFloat 3s ease-in-out infinite";
  else if (isSad) bodyAnim = "fomaShake .4s ease-in-out infinite";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 0 16px",
    }}>
      {/* Character */}
      <div style={{
        marginBottom: 14,
        animation: bodyAnim,
        position: "relative",
      }}>
        <svg
          width="120" height="120" viewBox="0 0 100 100"
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))", overflow: "visible" }}
        >
          {/* Sparkles when all done */}
          {allDone && <Sparkles />}

          {/* Body */}
          <ellipse cx="50" cy="54" rx="34" ry="36" fill={m.bodyColor}
            style={{ transition: "fill .6s ease" }} />
          <ellipse cx="50" cy="54" rx="34" ry="36" fill="url(#foma-highlight)" opacity="0.3" />

          {/* Zzz for sleepy */}
          {isSleepy && (
            <g style={{ animation: "fomaZzz 3s ease-in-out infinite" }}>
              <text x="72" y="30" fontSize="10" fill="#9C9889" fontFamily="var(--font-serif)" fontStyle="italic" opacity="0.6">z</text>
              <text x="78" y="22" fontSize="8" fill="#9C9889" fontFamily="var(--font-serif)" fontStyle="italic" opacity="0.4"
                style={{ animation: "fomaZzz 3s ease-in-out 0.5s infinite" }}>z</text>
              <text x="83" y="15" fontSize="6" fill="#9C9889" fontFamily="var(--font-serif)" fontStyle="italic" opacity="0.25"
                style={{ animation: "fomaZzz 3s ease-in-out 1s infinite" }}>z</text>
            </g>
          )}

          {/* Tear drop for sad */}
          {isSad && (
            <ellipse cx="63" cy="50" rx="1.5" ry="2.5" fill="#7FB5D5" opacity="0.6"
              style={{ animation: "fomaTear 2s ease-in-out infinite" }} />
          )}

          {/* Eyes */}
          <ellipse cx="40" cy={m.eyeY} rx="4.5" ry={m.eyeH / 2 * eyeScale} fill="#fff"
            style={{ transition: "ry .1s ease, cy .4s ease" }} />
          <ellipse cx="60" cy={m.eyeY} rx="4.5" ry={m.eyeH / 2 * eyeScale} fill="#fff"
            style={{ transition: "ry .1s ease, cy .4s ease" }} />

          {/* Pupils with look direction */}
          {m.eyeH > 5 && !blink && <>
            <circle cx={41 + look.x} cy={m.eyeY + 1 + look.y} r="2.2" fill="#1A1917"
              style={{ transition: "cx .6s ease, cy .6s ease" }} />
            <circle cx={61 + look.x} cy={m.eyeY + 1 + look.y} r="2.2" fill="#1A1917"
              style={{ transition: "cx .6s ease, cy .6s ease" }} />
            {/* Eye highlights */}
            <circle cx={42.5 + look.x * 0.3} cy={m.eyeY - 1 + look.y * 0.3} r="0.9" fill="#fff" opacity="0.8"
              style={{ transition: "cx .6s ease, cy .6s ease" }} />
            <circle cx={62.5 + look.x * 0.3} cy={m.eyeY - 1 + look.y * 0.3} r="0.9" fill="#fff" opacity="0.8"
              style={{ transition: "cx .6s ease, cy .6s ease" }} />
          </>}

          {/* Happy sparkle eyes when all done */}
          {allDone && !blink && m.eyeH > 5 && <>
            <circle cx={41 + look.x} cy={m.eyeY + 1 + look.y} r="1" fill="#FFD700" opacity="0.5"
              style={{ animation: "fomaSparkle 1.5s ease-in-out infinite" }} />
            <circle cx={61 + look.x} cy={m.eyeY + 1 + look.y} r="1" fill="#FFD700" opacity="0.5"
              style={{ animation: "fomaSparkle 1.5s ease-in-out 0.3s infinite" }} />
          </>}

          {/* Blush */}
          {m.blush && <>
            <ellipse cx="30" cy="52" rx="5" ry="3" fill="#E8A0A0" opacity={allDone ? "0.5" : "0.35"}
              style={{ transition: "opacity .6s" }} />
            <ellipse cx="70" cy="52" rx="5" ry="3" fill="#E8A0A0" opacity={allDone ? "0.5" : "0.35"}
              style={{ transition: "opacity .6s" }} />
          </>}

          {/* Mouth */}
          <path d={m.mouthD} fill="none" stroke="#fff" strokeWidth="2.2"
            strokeLinecap="round" style={{ transition: "all .4s ease" }} />

          {/* Happy open mouth when all done */}
          {allDone && (
            <ellipse cx="50" cy="60" rx="5" ry="3.5" fill="#3A5C40" opacity="0.4"
              style={{ transition: "all .4s" }} />
          )}

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
        @keyframes fomaFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(1deg); }
          75% { transform: translateY(-2px) rotate(-1deg); }
        }
        @keyframes fomaShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        @keyframes fomaSparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fomaZzz {
          0%, 100% { opacity: 0; transform: translateY(0); }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes fomaTear {
          0%, 100% { cy: 50; opacity: 0.6; }
          50% { cy: 56; opacity: 0.3; }
          100% { cy: 62; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
