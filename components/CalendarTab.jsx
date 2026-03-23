"use client";
import { useState, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { askClaude } from "@/lib/helpers";
import { Card, BigBtn, Sheet, SectionLabel } from "@/components/ui";
import { MONTH_NAMES, WEEK_DAYS } from "@/lib/data";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Tasks section ─────────────────────────────────────────
function TasksSection({ userId }) {
  const [tasks, setTasks] = useLocalState("forma_tasks", []);
  const [newTask, setNewTask] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!supabase || !userId) return;
    (async () => {
      const { data } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("date", todayStr())
        .order("created_at");
      if (data && data.length > 0) setTasks(data);
    })();
  }, [userId]);

  async function addTask() {
    if (!newTask.trim()) return;
    const task = {
      id: crypto.randomUUID(),
      user_id: userId,
      date: todayStr(),
      title: newTask.trim(),
      done: false,
      priority: 0,
      created_at: new Date().toISOString(),
    };
    setTasks(prev => [...prev, task]);
    setNewTask("");
    setShowAdd(false);

    if (supabase && userId) {
      await supabase.from("tasks").insert({
        user_id: userId, date: todayStr(),
        title: task.title, done: false, priority: 0,
      });
    }
  }

  async function toggleTask(id) {
    const updated = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(updated);
    if (supabase && userId) {
      const task = updated.find(t => t.id === id);
      await supabase.from("tasks").update({ done: task.done }).eq("id", id);
    }
  }

  async function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
    if (supabase && userId) {
      await supabase.from("tasks").delete().eq("id", id);
    }
  }

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SectionLabel>Задачи</SectionLabel>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {tasks.length > 0 && <span style={{ fontSize: 11, color: "var(--txt3)" }}>{doneCount}/{tasks.length}</span>}
          <button onClick={() => setShowAdd(true)} style={{ padding: "4px 12px", borderRadius: 8, background: "var(--accent)", color: "#fff", border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>+</button>
        </div>
      </div>

      {tasks.length === 0 && (
        <Card style={{ textAlign: "center", padding: "20px 16px", marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>Нет задач на сегодня</p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {tasks.map(task => (
          <Card key={task.id} pad="10px 14px" style={{ opacity: task.done ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => toggleTask(task.id)} style={{
                width: 22, height: 22, borderRadius: 7,
                border: `2px solid ${task.done ? "var(--green)" : "var(--border2)"}`,
                background: task.done ? "var(--green)" : "transparent",
                cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 11, transition: "all .15s",
              }}>{task.done && "✓"}</button>
              <span style={{ flex: 1, fontSize: 14, color: "var(--txt)", textDecoration: task.done ? "line-through" : "none" }}>{task.title}</span>
              <button onClick={() => deleteTask(task.id)} style={{ width: 22, height: 22, borderRadius: 6, border: "none", background: "transparent", color: "var(--txt3)", cursor: "pointer", fontSize: 13 }}>x</button>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Новая задача">
        <div style={{ marginBottom: 14 }}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Что нужно сделать?" autoFocus
            onKeyDown={e => e.key === "Enter" && addTask()}
            style={{ width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "var(--surface2)", color: "var(--txt)", fontSize: 15, outline: "none", fontFamily: "var(--font)", boxSizing: "border-box" }} />
        </div>
        <BigBtn onClick={addTask} disabled={!newTask.trim()}>Добавить</BigBtn>
      </Sheet>
    </>
  );
}

// ── Day detail sheet ──────────────────────────────────────
function DayDetail({ date, onClose, userId }) {
  const [data, setData] = useState(null);
  const [advice, setAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  useEffect(() => {
    if (!date) return;
    loadDay(date);
  }, [date]);

  async function loadDay(d) {
    const result = { meals: [], diary: [], tasks: [], forms: [] };

    // Meals from localStorage
    try {
      const raw = localStorage.getItem("forma_meals_today");
      const mDate = localStorage.getItem("forma_meals_date");
      if (raw && mDate === d) result.meals = JSON.parse(raw);
    } catch {}

    // Diary from localStorage
    try {
      const raw = localStorage.getItem("forma_diary");
      if (raw) {
        const all = JSON.parse(raw);
        result.diary = all.filter(e => e.date === d);
      }
    } catch {}

    // Tasks from localStorage
    try {
      const raw = localStorage.getItem("forma_tasks");
      if (raw) {
        result.tasks = JSON.parse(raw).filter(t => t.date === d);
      }
    } catch {}

    // Forms from localStorage
    try {
      const raw = localStorage.getItem("forma_forms");
      if (raw) result.forms = JSON.parse(raw);
    } catch {}

    // Try Supabase for historical data
    if (supabase && userId) {
      try {
        const { data: meals } = await supabase.from("meals").select("*").eq("user_id", userId).eq("date", d);
        if (meals && meals.length > 0) result.meals = meals;
      } catch {}
      try {
        const { data: diary } = await supabase.from("diary").select("*").eq("user_id", userId).eq("date", d);
        if (diary && diary.length > 0) result.diary = diary;
      } catch {}
      try {
        const { data: tasks } = await supabase.from("tasks").select("*").eq("user_id", userId).eq("date", d);
        if (tasks && tasks.length > 0) result.tasks = tasks;
      } catch {}
    }

    setData(result);
  }

  async function getAdvice() {
    if (!data) return;
    setLoadingAdvice(true);
    try {
      const summary = [];
      if (data.meals.length > 0) {
        const totalCal = data.meals.reduce((s, m) => s + (m.calories || 0), 0);
        summary.push(`Еда: ${data.meals.length} приемов, ${totalCal} ккал`);
      }
      if (data.tasks.length > 0) {
        const done = data.tasks.filter(t => t.done).length;
        summary.push(`Задачи: ${done}/${data.tasks.length}`);
      }
      if (data.diary.length > 0) {
        summary.push(`Дневник: ${data.diary.map(d => `${d.emotion || "?"} — ${(d.text || "").slice(0, 60)}`).join("; ")}`);
      }
      if (data.forms.length > 0) {
        const checked = data.forms.filter(f => f.checkedToday).length;
        summary.push(`Формы: ${checked}/${data.forms.length} выполнено`);
      }

      const reply = await askClaude({
        system: "Ты Фома — персональный ассистент. Проанализируй день пользователя и дай 2-3 коротких совета на основе данных. Пиши на русском, кратко, конкретно.",
        prompt: `Данные за ${date}:\n${summary.join("\n") || "Мало данных за этот день."}`,
        max_tokens: 300,
      });
      setAdvice(reply);
    } catch (err) {
      setAdvice("Ошибка: " + err.message);
    }
    setLoadingAdvice(false);
  }

  if (!date) return null;
  const d = new Date(date + "T12:00:00");
  const label = d.toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Sheet open title={label} onClose={onClose}>
      {!data ? (
        <p style={{ textAlign: "center", color: "var(--txt3)", padding: 20 }}>Загрузка...</p>
      ) : (
        <>
          {/* Meals */}
          {data.meals.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Питание</p>
              {data.meals.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--txt)" }}>{m.dish || m.description || "Прием"}</span>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>{m.calories || "?"} ккал</span>
                </div>
              ))}
              <p style={{ fontSize: 12, color: "var(--txt2)", marginTop: 6 }}>
                Итого: {data.meals.reduce((s, m) => s + (m.calories || 0), 0)} ккал
              </p>
            </div>
          )}

          {/* Tasks */}
          {data.tasks.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Задачи</p>
              {data.tasks.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", padding: "4px 0", fontSize: 13, color: t.done ? "var(--green)" : "var(--txt)" }}>
                  <span>{t.done ? "✓" : "○"}</span>
                  <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Diary */}
          {data.diary.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Дневник</p>
              {data.diary.map((d, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 10, background: "var(--surface2)", marginBottom: 6, fontSize: 13, color: "var(--txt)", lineHeight: 1.5 }}>
                  {d.emotion && <span style={{ marginRight: 6 }}>{d.emotion}</span>}
                  {d.text}
                </div>
              ))}
            </div>
          )}

          {data.meals.length === 0 && data.tasks.length === 0 && data.diary.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--txt3)", padding: "20px 0", fontSize: 13 }}>Нет данных за этот день</p>
          )}

          {/* AI Advice */}
          {!advice ? (
            <button onClick={getAdvice} disabled={loadingAdvice} style={{
              width: "100%", padding: "12px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--accent)", background: "var(--accent-bg)",
              color: "var(--accent)", fontSize: 13, fontWeight: 600,
              cursor: loadingAdvice ? "wait" : "pointer",
              opacity: loadingAdvice ? 0.6 : 1,
            }}>
              {loadingAdvice ? "Анализирую..." : "Получить совет от Фомы"}
            </button>
          ) : (
            <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--accent-bg)", borderLeft: "3px solid var(--accent)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 6 }}>Совет Фомы</p>
              <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{advice}</p>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}

// ── Mini Calendar with day selection ─────────────────────
function MiniCalendar({ onSelectDay }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7;

  const todayDate = now.getDate();
  const isCurrentMonth = month === now.getMonth() && year === now.getFullYear();

  return (
    <Card style={{ marginBottom: 16 }} pad="16px">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => {
          if (month === 0) { setMonth(11); setYear(y => y - 1); }
          else setMonth(m => m - 1);
        }} style={{ border: "none", background: "transparent", color: "var(--txt2)", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>
          {"<"}
        </button>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={() => {
          if (month === 11) { setMonth(0); setYear(y => y + 1); }
          else setMonth(m => m + 1);
        }} style={{ border: "none", background: "transparent", color: "var(--txt2)", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>
          {">"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--txt3)", fontWeight: 500, padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {Array(offset).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          const isFuture = isCurrentMonth ? day > todayDate : (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth()));
          const ds = dateStr(new Date(year, month, day));
          return (
            <button key={day} onClick={() => !isFuture && onSelectDay(ds)}
              disabled={isFuture}
              style={{
                textAlign: "center", padding: "6px 0",
                fontSize: 13, fontWeight: isToday ? 700 : 400,
                color: isFuture ? "var(--border2)" : isToday ? "var(--accent)" : "var(--txt)",
                background: isToday ? "var(--accent-bg)" : "transparent",
                borderRadius: 8, border: "none", cursor: isFuture ? "default" : "pointer",
              }}>
              {day}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Calendar Tab ──────────────────────────────────────────
export default function CalendarTab({ userId, userName, forms }) {
  const [section, setSection] = useState("history");
  const [selectedDay, setSelectedDay] = useState(null);

  const sections = [["history", "История"], ["tasks", "Задачи"], ["exp", "Опыты"]];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionLabel>Календарь</SectionLabel>
        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: 3 }}>
          {sections.map(([id, label]) => (
            <button key={id} onClick={() => setSection(id)} style={{
              padding: "6px 12px", borderRadius: 9,
              fontSize: 11, fontWeight: section === id ? 600 : 400,
              cursor: "pointer", transition: "all .15s", border: "none",
              background: section === id ? "var(--surface)" : "transparent",
              color: section === id ? "var(--txt)" : "var(--txt3)",
              boxShadow: section === id ? "var(--shadow-sm)" : "none",
            }}>{label}</button>
          ))}
        </div>
      </div>

      {(section === "history" || section === "tasks") && <MiniCalendar onSelectDay={setSelectedDay} />}

      {section === "history" && (
        <Card style={{ textAlign: "center", padding: "16px" }}>
          <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>
            Нажми на день в календаре, чтобы посмотреть историю и получить совет
          </p>
        </Card>
      )}

      {section === "tasks" && <TasksSection userId={userId} />}
      {section === "exp" && null}

      <DayDetail date={selectedDay} onClose={() => setSelectedDay(null)} userId={userId} />
    </>
  );
}
