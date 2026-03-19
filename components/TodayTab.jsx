"use client";
import { useState, useRef } from "react";
import { Card, Pill, Ring, Dots, BigBtn, Sheet, Field, TextInput, TimeInput, SectionLabel } from "@/components/ui";
import { getCat, getType, calcDailyScore, timeDiffMin, fmtMins, addHours, askClaude } from "@/lib/helpers";
import SessionTimer from "@/components/SessionTimer";
import Mascot from "@/components/Mascot";

const SIM_NOW = "08:47";

// ── Check-in: Time ────────────────────────────────────────
function CheckInTime({ form, onSave, onClose }) {
  const [t, setT] = useState(SIM_NOW);
  const diff = timeDiffMin(form.target, t);
  const exact = Math.abs(diff) <= 5;
  const color = exact ? "var(--green)" : diff > 0 ? (diff < 30 ? "var(--gold)" : "var(--red)") : "var(--blue)";
  const pts = exact ? form.pts
    : diff > 0 ? (diff <= 15 ? Math.round(form.pts * .9) : diff <= 30 ? Math.round(form.pts * .6) : Math.round(form.pts * .2))
    : form.pts;
  return <>
    <Field label="Фактическое время" hint={`Цель — ${form.target}`}>
      <TimeInput value={t} onChange={e => setT(e.target.value)} />
    </Field>
    <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: exact ? "var(--green-bg)" : diff > 0 ? "var(--accent-bg)" : "var(--blue-bg)", marginBottom: 18 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color, margin: 0 }}>
        {exact ? `Точно по форме — ${pts}`
          : diff > 0 ? `Опоздание ${fmtMins(diff)} — ${pts} из ${form.pts}`
          : `Раньше цели — ${pts}`}
      </p>
    </div>
    <BigBtn onClick={() => onSave({ checkedAt: t })} color={color}>Отметить</BigBtn>
  </>;
}

// ── Check-in: Duration ────────────────────────────────────
function CheckInDuration({ form, onSave, onStartSession }) {
  const [mins, setMins] = useState(form.logged || 0);
  const [note, setNote] = useState(form.note || "");
  const [isListening, setIsListening] = useState(false);
  const [tgPost, setTgPost] = useState("");
  const [generating, setGenerating] = useState(false);
  const recognitionRef = useRef(null);
  const target = form.target || 60;
  const pct = Math.min(100, Math.round(mins / target * 100));
  const pts = mins >= target ? form.pts : note ? Math.round(form.pts * pct / 100) : Math.round(form.pts * .5 * pct / 100);
  const presets = [15, 30, 45, 60, 90, 120];

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + " ";
      }
      setNote(prev => prev ? prev + " " + transcript.trim() : transcript.trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopVoice() {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  }

  async function generatePost() {
    if (!note.trim()) return;
    setGenerating(true);
    try {
      const text = await askClaude({
        system: `Ты помощник Дениса, который ведёт телеграм-канал о саморазвитии, привычках и осознанности.
Денис делится мыслями после утреннего чтения.
Твоя задача — из его заметки/наговоренных мыслей сделать пост для ТГ-канала.
Формат: короткий (3-5 абзацев), живой, от первого лица, с практическим выводом.
Без хештегов, без "доброе утро", без формального тона. Как будто пишет другу, но публично.
Используй emoji умеренно (1-2 на пост). Пиши на русском.`,
        prompt: `Вот моя заметка после чтения:\n\n"${note}"\n\nСделай из этого пост для телеграм-канала.`,
        max_tokens: 1024,
      });
      setTgPost(text);
    } catch (err) {
      setTgPost("Ошибка: " + err.message);
    }
    setGenerating(false);
  }

  function copyPost() {
    navigator.clipboard?.writeText(tgPost);
  }

  return <>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 20 }}>
      <div style={{ position: "relative", display: "inline-flex" }}>
        <Ring pct={pct} size={76} stroke={4} color={pct >= 100 ? "var(--green)" : "var(--accent)"} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 400, fontStyle: "italic", color: "var(--txt)" }}>{mins}</span>
          <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 0.5 }}>мин</span>
        </div>
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "var(--txt)", lineHeight: 1 }}>{pts}</p>
        <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>из {form.pts}</p>
      </div>
    </div>

    <button
      onClick={onStartSession}
      style={{
        width: "100%", padding: "14px", marginBottom: 18,
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--accent)",
        background: "var(--accent-bg)",
        color: "var(--accent)",
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all .15s",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
      Начать сессию · {target} мин
    </button>

    <div style={{ position: "relative", marginBottom: 14 }}>
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "var(--border)" }} />
      <p style={{ position: "relative", textAlign: "center", fontSize: 10, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase" }}>
        <span style={{ background: "var(--surface)", padding: "0 10px" }}>или вручную</span>
      </p>
    </div>

    <Field label="Сколько минут?">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map(v => (
          <button key={v} onClick={() => setMins(v)} style={{ flex: "1 1 auto", minWidth: 44, padding: "9px 4px", borderRadius: "var(--radius-sm)", border: `1px solid ${mins === v ? "var(--accent)" : "var(--border2)"}`, background: mins === v ? "var(--accent-bg)" : "var(--surface2)", color: mins === v ? "var(--accent)" : "var(--txt2)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .12s" }}>{v}</button>
        ))}
      </div>
    </Field>

    <Field label="Главная мысль" hint="Наговори или напиши — AI сделает пост для ТГ">
      <div style={{ position: "relative" }}>
        <TextInput value={note} onChange={e => setNote(e.target.value)} placeholder="Что зацепило сегодня?" multiline rows={4} />
        <button
          onClick={isListening ? stopVoice : startVoice}
          style={{
            position: "absolute", right: 8, bottom: 8,
            width: 36, height: 36, borderRadius: "50%",
            border: "none", cursor: "pointer",
            background: isListening ? "#EF4444" : "var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: isListening ? "pulse 1.5s infinite" : "none",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
      </div>
    </Field>

    {isListening && (
      <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", marginBottom: 8, fontWeight: 500 }}>
        Слушаю...
      </p>
    )}

    {note.trim() && !tgPost && (
      <button
        onClick={generatePost}
        disabled={generating}
        style={{
          width: "100%", padding: "12px", marginBottom: 14,
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border2)",
          background: "var(--surface2)",
          color: "var(--txt)",
          fontSize: 13, fontWeight: 500, cursor: generating ? "wait" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: generating ? 0.6 : 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        {generating ? "Генерирую..." : "Сгенерировать пост для ТГ"}
      </button>
    )}

    {tgPost && (
      <div style={{ marginBottom: 14 }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--txt2)" }}>Пост для Telegram</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={generatePost} disabled={generating} style={{
              padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border2)",
              background: "var(--surface2)", color: "var(--txt3)", fontSize: 11,
              cursor: "pointer",
            }}>
              {generating ? "..." : "Ещё"}
            </button>
            <button onClick={copyPost} style={{
              padding: "4px 10px", borderRadius: 8, border: "1px solid var(--accent)",
              background: "var(--accent-bg)", color: "var(--accent)", fontSize: 11,
              cursor: "pointer", fontWeight: 600,
            }}>
              Копировать
            </button>
          </div>
        </div>
        <div style={{
          padding: "12px 14px", borderRadius: "var(--radius-sm)",
          background: "var(--surface2)", border: "1px solid var(--border)",
          fontSize: 13, color: "var(--txt)", lineHeight: 1.6,
          whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto",
        }}>
          {tgPost}
        </div>
      </div>
    )}

    <BigBtn onClick={() => onSave({ logged: mins, note, checkedToday: true })} color={pct >= 100 ? "var(--green)" : "var(--txt)"} disabled={mins === 0}>
      Сохранить · {pts}
    </BigBtn>

    <style>{`
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
      }
    `}</style>
  </>;
}

// ── Check-in: Meal ────────────────────────────────────────
function CheckInMeal({ form, onSave }) {
  const [meals, setMeals] = useState(form.meals ?? []);
  const nextIdx = meals.findIndex(m => !m.done);
  const mealColors = ["var(--accent)", "var(--blue)", "var(--green)"];
  function doMeal(idx) {
    const now = ["08:30", "12:45", "17:00"][idx];
    const next = meals.map((m, i) => i === idx ? { ...m, done: true, time: now } : m);
    setMeals(next);
    onSave({ meals: next, lastAt: now, checkedToday: next.every(m => m.done) });
  }
  return <>
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
      {meals.map((m, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", borderRadius: "var(--radius-sm)", background: m.done ? "var(--green-bg)" : i === nextIdx ? "var(--surface2)" : "var(--bg)", border: `1px solid ${m.done ? "var(--green)" : "var(--border)"}`, transition: "all .2s" }}>
          <div style={{ width: 34, height: 34, borderRadius: "var(--radius-sm)", background: m.done ? "var(--green)" : `${mealColors[i]}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: m.done ? "#fff" : mealColors[i], fontWeight: 600, flexShrink: 0 }}>
            {m.done ? "✓" : ["1", "2", "3"][i]}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 500, fontSize: 14, color: m.done ? "var(--green)" : "var(--txt)", margin: 0 }}>{m.l}</p>
            <p style={{ fontSize: 11, color: "var(--txt3)", margin: 0 }}>{m.done ? m.time : "Белок · клетчатка · углеводы"}</p>
          </div>
          {i === nextIdx && !m.done && (
            <button onClick={() => doMeal(i)} style={{ padding: "6px 12px", background: "var(--txt)", color: "var(--bg)", border: "none", borderRadius: "var(--radius-sm)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Отметить</button>
          )}
        </div>
      ))}
    </div>
    {meals.every(m => m.done) && (
      <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--green-bg)", border: "1px solid var(--green)", textAlign: "center" }}>
        <p style={{ color: "var(--green)", fontWeight: 500, fontSize: 13, margin: 0 }}>Все приёмы отмечены</p>
      </div>
    )}
  </>;
}

// ── Check-in: Boolean ─────────────────────────────────────
function CheckInBoolean({ form, onSave }) {
  const [broken, setBroken] = useState(false);
  const [note, setNote] = useState("");
  if (!broken) return <>
    <div style={{ padding: "24px 0", textAlign: "center" }}>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic", color: "var(--txt)", marginBottom: 6 }}>{form.name}</p>
      <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 28px" }}>{form.principle}</p>
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <BigBtn onClick={() => onSave({ checkedToday: true, brokenToday: false })} color="var(--green)">Соблюдал</BigBtn>
      <button onClick={() => setBroken(true)} style={{ flex: 1, padding: "13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Нарушил</button>
    </div>
  </>;
  return <>
    <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--red-bg)", border: "1px solid var(--red)", marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: "var(--red)", fontWeight: 500, margin: 0, lineHeight: 1.5 }}>Нарушение — не провал, это сигнал.</p>
    </div>
    <Field label="Почему не получилось?" hint="Честно, без осуждения — помогает найти паттерн">
      <TextInput value={note} onChange={e => setNote(e.target.value)} placeholder="Опиши ситуацию..." multiline rows={4} />
    </Field>
    <BigBtn onClick={() => onSave({ checkedToday: true, brokenToday: true, reflection: note })} disabled={!note.trim()}>
      Зафиксировать
    </BigBtn>
  </>;
}

// ── Check-in: Steps ──────────────────────────────────────
function CheckInSteps({ form, onSave }) {
  const [steps, setSteps] = useState(form.logged || 0);
  const target = form.target || 20000;
  const pct = Math.min(100, Math.round(steps / target * 100));
  const pts = steps >= target ? form.pts : Math.round(form.pts * pct / 100);
  const ok = steps >= target;
  const presets = [5000, 10000, 15000, 20000, 25000];

  return <>
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 20 }}>
      <div style={{ position: "relative", display: "inline-flex" }}>
        <Ring pct={pct} size={76} stroke={4} color={ok ? "var(--green)" : "var(--accent)"} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 400, fontStyle: "italic", color: "var(--txt)" }}>{(steps/1000).toFixed(1)}k</span>
          <span style={{ fontSize: 9, color: "var(--txt3)", letterSpacing: 0.5 }}>шагов</span>
        </div>
      </div>
      <div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 400, fontStyle: "italic", color: "var(--txt)", lineHeight: 1 }}>{pts}</p>
        <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 2 }}>из {form.pts}</p>
      </div>
    </div>

    <Field label="Сколько шагов?">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {presets.map(v => (
          <button key={v} onClick={() => setSteps(v)} style={{ flex: "1 1 auto", minWidth: 50, padding: "9px 4px", borderRadius: "var(--radius-sm)", border: `1px solid ${steps === v ? "var(--accent)" : "var(--border2)"}`, background: steps === v ? "var(--accent-bg)" : "var(--surface2)", color: steps === v ? "var(--accent)" : "var(--txt2)", fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .12s" }}>{(v/1000)}k</button>
        ))}
      </div>
      <input type="number" value={steps} onChange={e => setSteps(Number(e.target.value))} placeholder="Или введи число" style={{ padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)", background: "var(--surface2)", color: "var(--txt)", fontSize: 16, fontWeight: 500, outline: "none", width: "100%", boxSizing: "border-box" }} />
    </Field>

    <BigBtn onClick={() => onSave({ logged: steps, checkedToday: true })} color={ok ? "var(--green)" : "var(--accent)"} disabled={steps === 0}>
      {ok ? `Цель достигнута — ${pts}` : `Сохранить — ${pts}`}
    </BigBtn>
  </>;
}

// ── Check-in: Limit ───────────────────────────────────────
function CheckInLimit({ form, onSave }) {
  const [spent, setSpent] = useState(form.spent || 0);
  const limit = form.limitPerDay || 5000;
  const ok = spent <= limit;
  const pct = Math.min(100, Math.round(spent / limit * 100));
  return <>
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--txt2)" }}>Потрачено</span>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontStyle: "italic", color: ok ? "var(--green)" : "var(--red)", fontWeight: 400 }}>{spent.toLocaleString()} / {limit.toLocaleString()} ₽</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "var(--surface3)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 3, background: ok ? "var(--green)" : "var(--red)", width: `${pct}%`, transition: "width .4s ease" }} />
      </div>
    </div>
    <Field label="Сколько потратил сегодня, ₽">
      <input type="number" value={spent} onChange={e => setSpent(Number(e.target.value))} style={{ padding: "11px 14px", border: "1px solid var(--border2)", borderRadius: "var(--radius-sm)", background: "var(--surface2)", color: "var(--txt)", fontSize: 20, fontWeight: 600, fontFamily: "var(--font-serif)", outline: "none", width: "100%" }} />
    </Field>
    <BigBtn onClick={() => onSave({ spent, checkedToday: true })} color={ok ? "var(--green)" : "var(--red)"}>
      {ok ? `В рамках — ${form.pts}` : "Превышение — 0"}
    </BigBtn>
  </>;
}

// ── Activity card (wellness style) ────────────────────────
function ActivityCard({ form, done, onOpen }) {
  const cat = getCat(form.cat);
  const tp = getType(form.type);
  const mealAllDone = form.type === "meal" && form.meals?.every(m => m.done);
  const isDone = done || mealAllDone;

  // Mini status line
  let statusText = null;
  let statusColor = "var(--txt3)";
  if (form.type === "time" && form.checkedAt) {
    const diff = timeDiffMin(form.target, form.checkedAt);
    statusText = form.checkedAt;
    statusColor = Math.abs(diff) <= 5 ? "var(--green)" : diff > 0 ? "var(--gold)" : "var(--blue)";
  }
  if (form.type === "duration" && form.checkedToday) {
    statusText = `${form.logged} мин`;
    statusColor = "var(--blue)";
  }
  if (form.type === "steps" && form.checkedToday) {
    statusText = `${(form.logged/1000).toFixed(1)}k`;
    statusColor = form.logged >= (form.target || 20000) ? "var(--green)" : "var(--accent)";
  }
  if (form.type === "meal") {
    const cnt = form.meals?.filter(m => m.done).length || 0;
    statusText = `${cnt}/3`;
    statusColor = cnt === 3 ? "var(--green)" : "var(--txt3)";
  }

  // Mini bar for streaks
  const maxStreak = 60;
  const streakPct = Math.min(100, Math.round(form.streak / maxStreak * 100));

  return (
    <Card onClick={onOpen} data-form={form.type} style={{
      marginBottom: 10,
      opacity: isDone && form.type !== "meal" ? 0.6 : 1,
      borderLeft: `3px solid ${isDone ? "var(--green)" : cat.color}`,
    }} pad="16px 18px">
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: isDone ? "var(--green-bg)" : `${cat.color}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, flexShrink: 0,
        }}>
          {isDone ? <span style={{ color: "var(--green)", fontSize: 18, fontWeight: 600 }}>✓</span> : <span>{tp.icon}</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: isDone ? "var(--green)" : "var(--txt)" }}>
              {form.name}
            </span>
            {statusText && (
              <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{statusText}</span>
            )}
          </div>

          {/* Streak bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--surface3)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: isDone ? "var(--green)" : cat.color,
                width: `${streakPct}%`,
                transition: "width .5s ease",
              }} />
            </div>
            <span style={{
              fontSize: 11, color: "var(--txt3)", fontWeight: 500,
              minWidth: 32, textAlign: "right",
            }}>
              {form.streak}д
            </span>
          </div>
        </div>
      </div>

      {/* Meal progress */}
      {form.type === "meal" && form.meals && (
        <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
          {form.meals.map((m, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: m.done ? "var(--green)" : "var(--surface3)",
              transition: "background .3s",
            }} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ── TODAY TAB ─────────────────────────────────────────────
export default function TodayTab({ forms, setForms }) {
  const [activeId, setActiveId] = useState(null);
  const [sessionForm, setSessionForm] = useState(null);
  const score = calcDailyScore(forms);
  const maxScore = forms.reduce((a, f) => a + f.pts, 0);
  const pct = maxScore ? Math.round(score / maxScore * 100) : 0;
  const doneCount = forms.filter(f => f.checkedToday).length;
  const hasBroken = forms.some(f => f.brokenToday);

  function handleSave(id, patch) {
    setForms(fs => fs.map(f => f.id === id ? { ...f, ...patch, checkedToday: patch.checkedToday !== undefined ? patch.checkedToday : true } : f));
    setActiveId(null);
  }

  const open = activeId ? forms.find(f => f.id === activeId) : null;
  const pending = forms.filter(f => f.type === "meal" || !f.checkedToday);
  const done = forms.filter(f => f.type !== "meal" && f.checkedToday);

  return <>
    {/* Mascot hero */}
    <Card style={{ marginBottom: 16, overflow: "hidden" }} pad="0">
      <div style={{
        background: "linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <Mascot pct={pct} forms={forms} hasBroken={hasBroken} />
      </div>

      {/* Stats row */}
      <div style={{
        display: "flex", padding: "14px 18px",
        gap: 0,
      }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--txt)", lineHeight: 1 }}>{score}</p>
          <p style={{ fontSize: 10, color: "var(--txt3)", marginTop: 3, letterSpacing: 0.3 }}>очков</p>
        </div>
        <div style={{ width: 1, background: "var(--border)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--txt)", lineHeight: 1 }}>{doneCount}/{forms.length}</p>
          <p style={{ fontSize: 10, color: "var(--txt3)", marginTop: 3, letterSpacing: 0.3 }}>форм</p>
        </div>
        <div style={{ width: 1, background: "var(--border)" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300, fontStyle: "italic", color: "var(--txt)", lineHeight: 1 }}>{forms.reduce((a, f) => Math.max(a, f.streak), 0)}</p>
          <p style={{ fontSize: 10, color: "var(--txt3)", marginTop: 3, letterSpacing: 0.3 }}>макс. стрик</p>
        </div>
      </div>
    </Card>

    {/* Activity section header */}
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 10, padding: "0 2px",
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase" }}>
        Активности
      </p>
      <p style={{ fontSize: 11, color: "var(--txt3)" }}>
        {new Date().toLocaleDateString("ru", { weekday: "short", day: "numeric", month: "short" })}
      </p>
    </div>

    {pending.map(f => <ActivityCard key={f.id} form={f} onOpen={() => setActiveId(f.id)} />)}

    {done.length > 0 && (
      <>
        <p style={{
          fontSize: 11, fontWeight: 600, color: "var(--green)",
          letterSpacing: 1, textTransform: "uppercase",
          margin: "16px 2px 10px",
        }}>
          Выполнено
        </p>
        {done.map(f => <ActivityCard key={f.id} form={f} done onOpen={() => setActiveId(f.id)} />)}
      </>
    )}

    {open && (
      <Sheet open title={open.name} onClose={() => setActiveId(null)}>
        {open.type === "time"     && <CheckInTime     form={open} onSave={p => handleSave(open.id, p)} onClose={() => setActiveId(null)} />}
        {open.type === "duration" && <CheckInDuration form={open} onSave={p => handleSave(open.id, p)} onStartSession={() => setSessionForm(open)} />}
        {open.type === "meal"     && <CheckInMeal     form={open} onSave={p => handleSave(open.id, p)} />}
        {open.type === "boolean"  && <CheckInBoolean  form={open} onSave={p => handleSave(open.id, p)} />}
        {open.type === "steps"    && <CheckInSteps    form={open} onSave={p => handleSave(open.id, p)} />}
        {open.type === "limit"    && <CheckInLimit    form={open} onSave={p => handleSave(open.id, p)} />}
      </Sheet>
    )}

    {sessionForm && (
      <SessionTimer
        form={sessionForm}
        targetMins={sessionForm.target || 60}
        onFinish={(sessionMins) => {
          handleSave(sessionForm.id, { logged: sessionMins, checkedToday: true });
          setSessionForm(null);
        }}
        onClose={() => setSessionForm(null)}
      />
    )}
  </>;
}
