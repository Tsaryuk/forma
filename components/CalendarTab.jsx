"use client";
import { useState, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { Card, BigBtn, Sheet, SectionLabel } from "@/components/ui";
import { MONTH_NAMES, WEEK_DAYS } from "@/lib/data";
import ChallengeWidget from "@/components/ChallengeWidget";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Tasks section ─────────────────────────────────────────
function TasksSection({ userId }) {
  const [tasks, setTasks] = useLocalState("forma_tasks", []);
  const [newTask, setNewTask] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Sync with Supabase
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
    const updated = [...tasks, task];
    setTasks(updated);
    setNewTask("");
    setShowAdd(false);

    if (supabase && userId) {
      await supabase.from("tasks").insert({
        user_id: userId,
        date: todayStr(),
        title: task.title,
        done: false,
        priority: 0,
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
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10, padding: "0 2px",
      }}>
        <SectionLabel>Задачи на сегодня</SectionLabel>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {tasks.length > 0 && (
            <span style={{ fontSize: 11, color: "var(--txt3)" }}>
              {doneCount}/{tasks.length}
            </span>
          )}
          <button
            onClick={() => setShowAdd(true)}
            style={{
              padding: "4px 12px", borderRadius: 8,
              background: "var(--accent)", color: "#fff",
              border: "none", fontSize: 11, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
      </div>

      {tasks.length === 0 && (
        <Card style={{ textAlign: "center", padding: "24px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>Нет задач на сегодня</p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
        {tasks.map(task => (
          <Card key={task.id} pad="12px 14px" style={{ opacity: task.done ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={() => toggleTask(task.id)}
                style={{
                  width: 24, height: 24, borderRadius: 8,
                  border: `2px solid ${task.done ? "var(--green)" : "var(--border2)"}`,
                  background: task.done ? "var(--green)" : "transparent",
                  cursor: "pointer", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12,
                  transition: "all .15s",
                }}
              >
                {task.done && "✓"}
              </button>
              <span style={{
                flex: 1, fontSize: 14, color: "var(--txt)",
                textDecoration: task.done ? "line-through" : "none",
              }}>
                {task.title}
              </span>
              <button
                onClick={() => deleteTask(task.id)}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  border: "none", background: "transparent",
                  color: "var(--txt3)", cursor: "pointer", fontSize: 14,
                }}
              >
                x
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add task sheet */}
      <Sheet open={showAdd} onClose={() => setShowAdd(false)} title="Новая задача">
        <div style={{ marginBottom: 14 }}>
          <input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Что нужно сделать?"
            autoFocus
            onKeyDown={e => e.key === "Enter" && addTask()}
            style={{
              width: "100%", padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border2)",
              background: "var(--surface2)", color: "var(--txt)",
              fontSize: 15, outline: "none",
              fontFamily: "var(--font)",
              boxSizing: "border-box",
            }}
          />
        </div>
        <BigBtn onClick={addTask} disabled={!newTask.trim()}>
          Добавить
        </BigBtn>
      </Sheet>
    </>
  );
}

// ── Mini Calendar ─────────────────────────────────────────
function MiniCalendar({ forms }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (firstDay + 6) % 7; // Monday-based

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
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontStyle: "italic", color: "var(--txt)" }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={() => {
          if (month === 11) { setMonth(0); setYear(y => y + 1); }
          else setMonth(m => m + 1);
        }} style={{ border: "none", background: "transparent", color: "var(--txt2)", cursor: "pointer", fontSize: 18, padding: "4px 8px" }}>
          {">"}
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {WEEK_DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "var(--txt3)", fontWeight: 500, padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {Array(offset).fill(null).map((_, i) => (
          <div key={`e${i}`} />
        ))}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const isToday = isCurrentMonth && day === todayDate;
          return (
            <div key={day} style={{
              textAlign: "center", padding: "6px 0",
              fontSize: 13, fontWeight: isToday ? 700 : 400,
              color: isToday ? "var(--accent)" : "var(--txt)",
              background: isToday ? "var(--accent-bg)" : "transparent",
              borderRadius: 8,
            }}>
              {day}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Calendar Tab ──────────────────────────────────────────
export default function CalendarTab({ userId, userName, forms }) {
  const [section, setSection] = useState("tasks");

  return (
    <>
      {/* Segmented control */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, padding: "0 2px",
      }}>
        <SectionLabel>Календарь</SectionLabel>
        <div style={{ display: "flex", gap: 4, background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: 3 }}>
          {[["tasks", "Задачи"], ["exp", "Опыты"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              style={{
                padding: "6px 14px",
                borderRadius: 9,
                fontSize: 12, fontWeight: section === id ? 600 : 400,
                cursor: "pointer",
                transition: "all .15s",
                border: "none",
                background: section === id ? "var(--surface)" : "transparent",
                color: section === id ? "var(--txt)" : "var(--txt3)",
                boxShadow: section === id ? "var(--shadow-sm)" : "none",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <MiniCalendar forms={forms} />

      {section === "tasks" && <TasksSection userId={userId} />}
      {section === "exp" && <ChallengeWidget />}
    </>
  );
}
