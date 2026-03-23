"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Sheet, Field, TextInput, TimeInput } from "@/components/ui";
import { timeDiffMin, fmtMins, addHours, askClaude } from "@/lib/helpers";
import SessionTimer from "@/components/SessionTimer";
import MealTracker from "@/components/MealTracker";

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── Notion-style Checkbox ──────────────────────────────────
function Checkbox({ checked, onChange, indeterminate }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: 18,
        height: 18,
        borderRadius: 3,
        border: checked ? "none" : "1.5px solid var(--border2)",
        background: checked ? "var(--txt)" : "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        transition: "all .12s",
      }}
    >
      {checked && (
        <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
          <path d="M1 4.5L4 7.5L10 1.5" stroke="var(--bg)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {indeterminate && !checked && (
        <div style={{ width: 8, height: 1.5, background: "var(--txt3)", borderRadius: 1 }} />
      )}
    </button>
  );
}

// ── Habit Row ──────────────────────────────────────────────
function HabitRow({ form, onOpen, onQuickCheck }) {
  const done = form.checkedToday && !form.brokenToday;
  const broken = form.brokenToday;

  // Sub-label
  let sub = "";
  if (form.type === "time") {
    sub = form.target;
    if (form.checkedToday && form.checkedAt) sub = `отмечено в ${form.checkedAt}`;
  } else if (form.type === "duration") {
    sub = `${form.target} мин`;
    if (form.logged) sub = `${form.logged} / ${form.target} мин`;
  } else if (form.type === "steps") {
    sub = `${(form.target || 15000).toLocaleString("ru")} шагов`;
    if (form.logged) sub = `${(form.logged || 0).toLocaleString("ru")} / ${(form.target || 15000).toLocaleString("ru")}`;
  } else if (form.type === "meal") {
    const done_ = (form.meals || []).filter(m => m.done).length;
    sub = `${done_} / ${(form.meals || []).length} приёма`;
    if (form.lastAt) sub += ` · след. в ${addHours(form.lastAt, form.intervalH || 4)}`;
  } else if (form.type === "weight") {
    sub = form.logged ? `${form.logged} кг` : "нажми, чтобы записать";
    if (form.logged && form.startWeight) {
      const diff = (form.startWeight - form.logged).toFixed(1);
      sub += ` · ${diff > 0 ? "−" : "+"}${Math.abs(diff)} кг`;
    }
  } else if (form.type === "tasks") {
    const done_ = (form.tasks || []).filter(t => t.done).length;
    const total = (form.tasks || []).filter(t => t.text).length;
    sub = total ? `${done_} / ${total} задач` : "нажми, чтобы добавить";
  }

  // Progress for steps/duration
  let pct = 0;
  if (form.type === "steps") pct = Math.min(100, Math.round((form.logged || 0) / (form.target || 15000) * 100));
  if (form.type === "duration") pct = Math.min(100, Math.round((form.logged || 0) / (form.target || 60) * 100));
  if (form.type === "meal") pct = Math.min(100, Math.round((form.meals || []).filter(m => m.done).length / 3 * 100));
  if (form.type === "tasks") {
    const total = (form.tasks || []).filter(t => t.text).length;
    const doneT = (form.tasks || []).filter(t => t.done).length;
    pct = total ? Math.min(100, Math.round(doneT / total * 100)) : 0;
  }

  const showProgress = ["steps", "duration", "meal", "tasks"].includes(form.type) && pct > 0;
  const isComplex = ["weight", "tasks", "meal", "duration", "steps", "time"].includes(form.type);

  return (
    <div
      onClick={() => onOpen(form)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 16px",
        borderBottom: "1px solid var(--border)",
        cursor: "pointer",
        background: "var(--surface)",
        transition: "background .1s",
      }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
      onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
    >
      <div onClick={e => {
        if (form.type === "boolean" || form.type === "time") {
          e.stopPropagation();
          onQuickCheck(form);
        }
      }}>
        <Checkbox
          checked={done}
          indeterminate={showProgress && !done}
          onChange={() => {}}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: done ? "var(--txt3)" : broken ? "var(--red)" : "var(--txt)",
            textDecoration: done ? "line-through" : "none",
            letterSpacing: "-0.01em",
          }}>{form.name}</span>
          {form.streak > 1 && (
            <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 400 }}>
              {form.streak}д
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 1 }}>
          <span style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 400 }}>{sub}</span>
        </div>
        {showProgress && (
          <div style={{ marginTop: 5, height: 2, background: "var(--border)", borderRadius: 1, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`,
              height: "100%",
              background: pct >= 100 ? "var(--green)" : "var(--accent)",
              borderRadius: 1,
              transition: "width .3s",
            }} />
          </div>
        )}
      </div>

      <div style={{ color: "var(--txt3)", flexShrink: 0 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  );
}

// ── Check-in: Time ─────────────────────────────────────────
function CheckInTime({ form, onSave, onClose }) {
  const [t, setT] = useState(nowHHMM);
  const diff = timeDiffMin(form.target, t);
  const early = diff <= 0;
  const exact = Math.abs(diff) <= 5;
  const pts = exact ? form.pts
    : diff > 0 ? (diff <= 15 ? Math.round(form.pts * .9) : diff <= 30 ? Math.round(form.pts * .6) : Math.round(form.pts * .2))
    : form.pts;
  const color = exact ? "var(--green)" : diff > 0 ? (diff < 30 ? "var(--gold)" : "var(--red)") : "var(--blue)";

  return (
    <div style={{ padding: "0 16px 24px" }}>
      <p style={{ fontSize: 13, color: "var(--txt2)", marginBottom: 16 }}>Цель — {form.target}</p>
      <Field label="Фактическое время">
        <TimeInput value={t} onChange={e => setT(e.target.value)} />
      </Field>
      <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", marginBottom: 16 }}>
        <p style={{ fontSize: 13, color, fontWeight: 500, margin: 0 }}>
          {exact ? `Точно — ${pts} очков`
            : diff > 0 ? `Опоздание ${fmtMins(diff)} — ${pts} из ${form.pts}`
            : `Раньше цели — ${pts} очков`}
        </p>
      </div>
      <button onClick={() => onSave({ checkedAt: t })} style={btnStyle()}>Отметить</button>
    </div>
  );
}

// ── Check-in: Duration ─────────────────────────────────────
function CheckInDuration({ form, onSave, onStartSession }) {
  const [mins, setMins] = useState(form.logged || 0);
  const [note, setNote] = useState(form.note || "");
  const [isListening, setIsListening] = useState(false);
  const [tgPost, setTgPost] = useState("");
  const [generating, setGenerating] = useState(false);
  const recognitionRef = useRef(null);
  const target = form.target || 60;
  const pct = Math.min(100, Math.round(mins / target * 100));
  const presets = form.id === "f4" ? [5, 10, 15, 20] : [15, 30, 45, 60, 90, 120];
  const isReading = form.id === "f6";

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Браузер не поддерживает распознавание речи"); return; }
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch(e) {} }
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = false;
    let finalText = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) { finalText += t + " "; } else { interim = t; }
      }
      const combined = (finalText + interim).trim();
      if (combined) setNote(prev => {
        const base = recognitionRef.current?._baseNote ?? prev;
        return base ? base + " " + combined : combined;
      });
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (finalText.trim()) setNote(prev => {
        const base = recognitionRef.current?._baseNote ?? "";
        return base ? base + " " + finalText.trim() : finalText.trim();
      });
      setIsListening(false);
    };
    recognition._baseNote = note;
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopVoice() {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
    setIsListening(false);
  }

  async function generatePost() {
    if (!note.trim()) return;
    setGenerating(true);
    try {
      const text = await askClaude({
        system: `Ты помощник, который ведёт телеграм-канал о саморазвитии и привычках.
Из заметок после чтения делай короткий живой пост от первого лица.
Формат: 3-5 абзацев, практический вывод. Без хештегов, без "доброе утро". 1-2 emoji. Русский язык.`,
        prompt: `Заметка после чтения:\n\n"${note}"\n\nСделай пост для телеграм-канала.`,
        max_tokens: 1024,
      });
      setTgPost(text);
    } catch (err) {
      setTgPost("Ошибка: " + err.message);
    }
    setGenerating(false);
  }

  return (
    <div style={{ padding: "0 16px 24px" }}>
      <button onClick={onStartSession} style={{ ...btnStyle("var(--surface2)", "var(--border)", "var(--txt)"), marginBottom: 16 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
        Запустить таймер · {target} мин
      </button>

      <Field label="Минут">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {presets.map(v => (
            <button key={v} onClick={() => setMins(v)} style={{
              flex: "1 1 auto", minWidth: 40, padding: "8px 4px",
              borderRadius: 6,
              border: `1px solid ${mins === v ? "var(--txt)" : "var(--border)"}`,
              background: mins === v ? "var(--txt)" : "var(--surface2)",
              color: mins === v ? "var(--bg)" : "var(--txt2)",
              fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .1s",
            }}>{v}</button>
          ))}
        </div>
      </Field>

      {isReading && (
        <Field label="Инвайты" hint="Голосом или текстом">
          <div style={{ position: "relative" }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Что зацепило в книге..."
              rows={3}
              style={{
                width: "100%", padding: "10px 40px 10px 12px",
                borderRadius: 6, border: "1px solid var(--border)",
                background: "var(--surface2)", color: "var(--txt)",
                fontSize: 14, fontFamily: "inherit", resize: "vertical",
                outline: "none",
              }}
            />
            <button
              onMouseDown={startVoice} onMouseUp={stopVoice}
              onTouchStart={startVoice} onTouchEnd={stopVoice}
              style={{
                position: "absolute", top: 8, right: 8,
                width: 28, height: 28, borderRadius: "50%",
                border: "none",
                background: isListening ? "var(--red)" : "var(--border2)",
                color: isListening ? "#fff" : "var(--txt2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {note.trim() && (
            <button onClick={generatePost} disabled={generating} style={{ ...btnStyle("var(--surface2)", "var(--border)", "var(--txt)"), marginTop: 8, fontSize: 12 }}>
              {generating ? "Генерирую..." : "Пост для ТГ"}
            </button>
          )}
          {tgPost && (
            <div style={{ marginTop: 10 }}>
              <div style={{ padding: "12px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {tgPost}
              </div>
              <button onClick={() => navigator.clipboard?.writeText(tgPost)} style={{ ...btnStyle("var(--surface2)", "var(--border)", "var(--txt)"), marginTop: 6, fontSize: 12 }}>
                Скопировать
              </button>
            </div>
          )}
        </Field>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 13, color: "var(--txt2)" }}>{pct}% выполнено</span>
        <span style={{ fontSize: 13, color: "var(--txt2)" }}>{mins} мин</span>
      </div>
      <button onClick={() => onSave({ logged: mins, note })} style={btnStyle()}>Сохранить</button>
    </div>
  );
}

// ── Check-in: Steps ────────────────────────────────────────
function CheckInSteps({ form, onSave }) {
  const [steps, setSteps] = useState(form.logged || 0);
  const target = form.target || 15000;
  const pct = Math.min(100, Math.round(steps / target * 100));

  return (
    <div style={{ padding: "0 16px 24px" }}>
      <p style={{ fontSize: 13, color: "var(--txt2)", marginBottom: 16 }}>Цель: {target.toLocaleString("ru")} шагов</p>
      <Field label="Шагов сегодня">
        <input
          type="number"
          value={steps || ""}
          onChange={e => setSteps(Number(e.target.value))}
          placeholder="0"
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 6,
            border: "1px solid var(--border)", background: "var(--surface2)",
            color: "var(--txt)", fontSize: 15, fontFamily: "inherit", outline: "none",
          }}
        />
      </Field>
      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? "var(--green)" : "var(--accent)", transition: "width .3s" }} />
        </div>
        <p style={{ fontSize: 12, color: "var(--txt3)", marginTop: 4 }}>{pct}% от цели</p>
      </div>
      <button onClick={() => onSave({ logged: steps })} style={btnStyle()}>Сохранить</button>
    </div>
  );
}

// ── Check-in: Weight ───────────────────────────────────────
function CheckInWeight({ form, onSave }) {
  const [kg, setKg] = useState(form.logged || "");
  const [fat, setFat] = useState(form.loggedFat || "");
  const [ropeMin, setRopeMin] = useState(0);
  const [ropeRunning, setRopeRunning] = useState(false);
  const ropeRef = useRef(null);
  const startRef = useRef(null);

  function startRope() {
    setRopeRunning(true);
    startRef.current = Date.now() - ropeMin * 60 * 1000;
    ropeRef.current = setInterval(() => {
      setRopeMin(Math.floor((Date.now() - startRef.current) / 1000 / 60 * 10) / 10);
    }, 500);
  }

  function stopRope() {
    clearInterval(ropeRef.current);
    setRopeRunning(false);
  }

  useEffect(() => () => clearInterval(ropeRef.current), []);

  const goalKg = form.goalKg || 6;
  const startW = form.startWeight || (kg ? Number(kg) : 80);
  const diff = form.startWeight && kg ? (form.startWeight - Number(kg)).toFixed(1) : null;
  const pct = diff ? Math.min(100, Math.round(diff / goalKg * 100)) : 0;

  return (
    <div style={{ padding: "0 16px 24px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <Field label="Вес (кг)" style={{ flex: 1 }}>
          <input
            type="number" step="0.1"
            value={kg}
            onChange={e => setKg(e.target.value)}
            placeholder="80.0"
            style={inputStyle()}
          />
        </Field>
        <Field label="Жир (%)" style={{ flex: 1 }}>
          <input
            type="number" step="0.1"
            value={fat}
            onChange={e => setFat(e.target.value)}
            placeholder="20.0"
            style={inputStyle()}
          />
        </Field>
      </div>

      {diff !== null && (
        <div style={{ padding: "10px 12px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: diff > 0 ? "var(--green)" : "var(--txt2)", fontWeight: 500, margin: 0 }}>
            {diff > 0 ? `−${diff} кг от старта` : `+${Math.abs(diff)} кг от старта`}
          </p>
          <div style={{ marginTop: 6, height: 2, background: "var(--border)", borderRadius: 1, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "var(--green)", transition: "width .3s" }} />
          </div>
          <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 3 }}>{pct}% к цели −{goalKg} кг</p>
        </div>
      )}

      <Field label="Скакалка">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", minWidth: 50 }}>
            {String(Math.floor(ropeMin)).padStart(2, "0")}:{String(Math.round((ropeMin % 1) * 60)).padStart(2, "0")}
          </span>
          {!ropeRunning ? (
            <button onClick={startRope} style={{ ...btnStyle("var(--surface2)", "var(--border)", "var(--txt)"), padding: "7px 14px", fontSize: 13 }}>Старт</button>
          ) : (
            <button onClick={stopRope} style={{ ...btnStyle("var(--red-bg)", "var(--red)", "var(--red)"), padding: "7px 14px", fontSize: 13 }}>Стоп</button>
          )}
          <span style={{ fontSize: 12, color: "var(--txt3)" }}>/ 10 мин</span>
        </div>
      </Field>

      <button onClick={() => onSave({ logged: Number(kg) || null, loggedFat: Number(fat) || null, ropeMinutes: ropeMin, startWeight: form.startWeight || Number(kg) || null })} style={{ ...btnStyle(), marginTop: 16 }}>Сохранить</button>
    </div>
  );
}

// ── Check-in: Tasks ────────────────────────────────────────
function CheckInTasks({ form, onSave }) {
  const [tasks, setTasks] = useState(() =>
    (form.tasks || [{ text: "", done: false }, { text: "", done: false }, { text: "", done: false }])
      .map(t => ({ ...t }))
  );
  const [isListening, setIsListening] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const recognitionRef = useRef(null);
  const [voiceText, setVoiceText] = useState("");

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Браузер не поддерживает распознавание речи"); return; }
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = true;
    let finalText = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + " ";
        else interim = e.results[i][0].transcript;
      }
      setVoiceText((finalText + interim).trim());
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoiceText(prev => prev);
    };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopVoice() {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
    setIsListening(false);
  }

  async function generateTasks() {
    const raw = voiceText.trim();
    if (!raw) return;
    setAiLoading(true);
    try {
      const text = await askClaude({
        system: "Ты помощник по планированию. Из диктовки пользователя выдели до 3 задач на сегодня. Ответь ТОЛЬКО JSON-массивом строк без лишнего текста. Пример: [\"Задача 1\", \"Задача 2\"]",
        prompt: `Диктовка: "${raw}"`,
        max_tokens: 256,
      });
      const arr = JSON.parse(text.trim());
      if (Array.isArray(arr)) {
        setTasks(arr.slice(0, 3).map((t, i) => ({ text: t, done: tasks[i]?.done || false })));
      }
    } catch (err) {
      // fallback: use voice text as first task
      setTasks(prev => [{ text: raw, done: false }, prev[1] || { text: "", done: false }, prev[2] || { text: "", done: false }]);
    }
    setAiLoading(false);
  }

  return (
    <div style={{ padding: "0 16px 24px" }}>
      {/* Voice input */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <button
            onMouseDown={startVoice} onMouseUp={stopVoice}
            onTouchStart={startVoice} onTouchEnd={stopVoice}
            style={{
              ...btnStyle(isListening ? "var(--red-bg)" : "var(--surface2)", isListening ? "var(--red)" : "var(--border)", isListening ? "var(--red)" : "var(--txt2)"),
              padding: "9px 14px", fontSize: 13,
            }}
          >
            {isListening ? "Запись..." : "Наговорить задачи"}
          </button>
          {voiceText && (
            <button onClick={generateTasks} disabled={aiLoading} style={{ ...btnStyle("var(--surface2)", "var(--border)", "var(--txt)"), padding: "9px 14px", fontSize: 13, flex: 1 }}>
              {aiLoading ? "..." : "AI → задачи"}
            </button>
          )}
        </div>
        {voiceText && (
          <p style={{ fontSize: 12, color: "var(--txt3)", lineHeight: 1.5 }}>{voiceText}</p>
        )}
      </div>

      {/* Task list */}
      {tasks.map((task, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Checkbox checked={task.done} onChange={() => setTasks(prev => prev.map((t, j) => j === i ? { ...t, done: !t.done } : t))} />
          <input
            type="text"
            value={task.text}
            onChange={e => setTasks(prev => prev.map((t, j) => j === i ? { ...t, text: e.target.value } : t))}
            placeholder={`Задача ${i + 1}`}
            style={{
              flex: 1, padding: "8px 10px", borderRadius: 6,
              border: "1px solid var(--border)", background: "var(--surface2)",
              color: "var(--txt)", fontSize: 14, fontFamily: "inherit",
              outline: "none", textDecoration: task.done ? "line-through" : "none",
            }}
          />
        </div>
      ))}

      <button onClick={() => onSave({ tasks })} style={{ ...btnStyle(), marginTop: 8 }}>Сохранить</button>
    </div>
  );
}

// ── Button style helpers ───────────────────────────────────
function btnStyle(bg = "var(--txt)", border = "var(--txt)", color = "var(--bg)") {
  return {
    width: "100%", padding: "11px 16px",
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: bg,
    color,
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "opacity .12s",
    fontFamily: "inherit",
    letterSpacing: "-0.01em",
  };
}

function inputStyle() {
  return {
    width: "100%", padding: "10px 12px", borderRadius: 6,
    border: "1px solid var(--border)", background: "var(--surface2)",
    color: "var(--txt)", fontSize: 15, fontFamily: "inherit", outline: "none",
  };
}

// ── TodayTab ───────────────────────────────────────────────
export default function TodayTab({ forms, setForms, userId, userName }) {
  const [activeForm, setActiveForm] = useState(null);
  const [sessionForm, setSessionForm] = useState(null);

  function openForm(form) {
    setActiveForm(form);
  }

  function closeForm() {
    setActiveForm(null);
  }

  function quickCheck(form) {
    if (form.type === "boolean") {
      setForms(prev => prev.map(f => f.id === form.id ? {
        ...f,
        checkedToday: !f.checkedToday,
        brokenToday: false,
        streak: !f.checkedToday ? (f.streak || 0) + 1 : Math.max(0, (f.streak || 1) - 1),
      } : f));
    } else if (form.type === "time") {
      openForm(form);
    }
  }

  function saveForm(formId, updates) {
    setForms(prev => prev.map(f => {
      if (f.id !== formId) return f;
      const wasChecked = f.checkedToday;
      const nowChecked = updates.checkedToday !== undefined ? updates.checkedToday : true;
      return {
        ...f,
        ...updates,
        checkedToday: nowChecked,
        streak: nowChecked && !wasChecked ? (f.streak || 0) + 1 : f.streak,
        history: nowChecked && !wasChecked
          ? [...(f.history || []), { date: new Date().toISOString().slice(0, 10), ...updates }]
          : f.history,
      };
    }));
    setActiveForm(null);
  }

  function startSession(form) {
    setActiveForm(null);
    setSessionForm(form);
  }

  function onSessionDone(formId, mins) {
    setForms(prev => prev.map(f => f.id !== formId ? f : {
      ...f,
      logged: mins,
      checkedToday: mins >= (f.target || 60),
      streak: mins >= (f.target || 60) ? (f.streak || 0) + 1 : f.streak,
      history: mins >= (f.target || 60) ? [...(f.history || []), { date: new Date().toISOString().slice(0, 10), logged: mins }] : f.history,
    }));
    setSessionForm(null);
  }

  // Section headers mapping
  const sections = [
    { label: "Режим", ids: ["f1", "f2"] },
    { label: "Тело", ids: ["f3", "f4", "f5", "f7"] },
    { label: "Разум", ids: ["f6", "f8", "f9"] },
  ];

  const formMap = Object.fromEntries(forms.map(f => [f.id, f]));

  return (
    <>
      <div className="fade-up">
        {sections.map(section => {
          const sectionForms = section.ids.map(id => formMap[id]).filter(Boolean);
          if (!sectionForms.length) return null;
          return (
            <div key={section.label}>
              <div style={{
                padding: "12px 16px 4px",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--txt3)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}>
                {section.label}
              </div>
              <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                {sectionForms.map(form => (
                  <HabitRow
                    key={form.id}
                    form={form}
                    onOpen={openForm}
                    onQuickCheck={quickCheck}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Check-in Sheet */}
      <Sheet
        open={!!activeForm}
        onClose={closeForm}
        title={activeForm?.name}
      >
        {activeForm?.type === "time" && (
          <CheckInTime form={activeForm} onSave={(u) => saveForm(activeForm.id, u)} onClose={closeForm} />
        )}
        {activeForm?.type === "duration" && (
          <CheckInDuration
            form={activeForm}
            onSave={(u) => saveForm(activeForm.id, u)}
            onStartSession={() => startSession(activeForm)}
          />
        )}
        {activeForm?.type === "steps" && (
          <CheckInSteps form={activeForm} onSave={(u) => saveForm(activeForm.id, u)} />
        )}
        {activeForm?.type === "weight" && (
          <CheckInWeight form={activeForm} onSave={(u) => saveForm(activeForm.id, { ...u, checkedToday: !!u.logged })} />
        )}
        {activeForm?.type === "tasks" && (
          <CheckInTasks form={activeForm} onSave={(u) => saveForm(activeForm.id, { ...u, checkedToday: u.tasks?.some(t => t.done) })} />
        )}
        {activeForm?.type === "meal" && (
          <div style={{ padding: "0 0 24px" }}>
            <MealTracker userId={userId} />
          </div>
        )}
        {activeForm?.type === "boolean" && (
          <div style={{ padding: "0 16px 24px" }}>
            <p style={{ fontSize: 13, color: "var(--txt2)", marginBottom: 16 }}>{activeForm.principle}</p>
            <button onClick={() => saveForm(activeForm.id, { checkedToday: true, brokenToday: false })} style={btnStyle()}>
              Выполнено
            </button>
            <button onClick={() => saveForm(activeForm.id, { checkedToday: true, brokenToday: true })} style={{ ...btnStyle("var(--surface2)", "var(--border)", "var(--red)"), marginTop: 8 }}>
              Не выполнено
            </button>
          </div>
        )}
      </Sheet>

      {/* Session Timer */}
      {sessionForm && (
        <SessionTimer
          form={sessionForm}
          onDone={(mins) => onSessionDone(sessionForm.id, mins)}
          onClose={() => setSessionForm(null)}
        />
      )}
    </>
  );
}
