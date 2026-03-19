"use client";
import { useState, useRef, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { Card, Sheet, BigBtn, SectionLabel } from "@/components/ui";

const EMOTIONS = [
  { id: "great",   emoji: "\u{1F929}", label: "Супер" },
  { id: "good",    emoji: "\u{1F60A}", label: "Хорошо" },
  { id: "neutral", emoji: "\u{1F610}", label: "Норм" },
  { id: "bad",     emoji: "\u{1F614}", label: "Плохо" },
  { id: "awful",   emoji: "\u{1F62D}", label: "Ужас" },
];

function formatDate(d) {
  return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "long", weekday: "short" });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DiaryTab({ userName }) {
  const [entries, setEntries] = useLocalState("forma_diary", []);
  const [showNew, setShowNew] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const todayEntry = entries.find(e => e.date === todayKey());
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setText(prev => prev ? prev + " " + transcript : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopVoice() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }

  function save() {
    if (!emotion && !text.trim()) return;
    const key = todayKey();
    const entry = {
      date: key,
      emotion: emotion,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => {
      const without = prev.filter(e => e.date !== key);
      return [entry, ...without];
    });
    setShowNew(false);
    setEmotion(null);
    setText("");
  }

  function openNew() {
    if (todayEntry) {
      setEmotion(todayEntry.emotion);
      setText(todayEntry.text);
    } else {
      setEmotion(null);
      setText("");
    }
    setShowNew(true);
  }

  return (
    <>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, padding: "0 2px",
      }}>
        <SectionLabel>Дневник</SectionLabel>
        <button
          onClick={openNew}
          style={{
            padding: "6px 16px", borderRadius: 10,
            background: "var(--accent)", color: "#fff",
            border: "none", fontSize: 12, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {todayEntry ? "Изменить" : "+ Записать"}
        </button>
      </div>

      {sorted.length === 0 && (
        <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{"\u{1F4DD}"}</div>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--txt)", marginBottom: 6 }}>
            Пока пусто
          </p>
          <p style={{ fontSize: 13, color: "var(--txt3)" }}>
            Записывай мысли, отслеживай настроение
          </p>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sorted.map(entry => {
          const em = EMOTIONS.find(e => e.id === entry.emotion);
          return (
            <Card key={entry.date} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: entry.text ? 8 : 0 }}>
                <span style={{ fontSize: 12, color: "var(--txt3)", fontWeight: 500 }}>
                  {formatDate(entry.date)}
                </span>
                {em && (
                  <span style={{ fontSize: 20 }} title={em.label}>{em.emoji}</span>
                )}
              </div>
              {entry.text && (
                <p style={{ fontSize: 14, color: "var(--txt)", lineHeight: 1.5, margin: 0 }}>
                  {entry.text}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── New entry sheet ── */}
      <Sheet open={showNew} onClose={() => { setShowNew(false); stopVoice(); }} title={todayEntry ? "Изменить запись" : "Новая запись"}>
        <div style={{ padding: "0 4px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", marginBottom: 10 }}>
            Как настроение?
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {EMOTIONS.map(em => (
              <button
                key={em.id}
                onClick={() => setEmotion(em.id)}
                style={{
                  flex: 1, border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  padding: "10px 4px",
                  borderRadius: 12,
                  background: emotion === em.id ? "var(--accent-bg)" : "var(--surface2)",
                  transition: "all .15s",
                  transform: emotion === em.id ? "scale(1.08)" : "scale(1)",
                }}
              >
                <span style={{ fontSize: 24 }}>{em.emoji}</span>
                <span style={{
                  fontSize: 10, fontWeight: emotion === em.id ? 600 : 400,
                  color: emotion === em.id ? "var(--accent)" : "var(--txt3)",
                }}>
                  {em.label}
                </span>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", marginBottom: 8 }}>
            Что на уме?
          </p>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Расскажи о своем дне..."
              rows={4}
              style={{
                width: "100%", padding: "12px 44px 12px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                background: "var(--surface2)",
                color: "var(--txt)", fontSize: 14,
                resize: "vertical", outline: "none",
                lineHeight: 1.5,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={isListening ? stopVoice : startVoice}
              style={{
                position: "absolute", right: 8, bottom: 8,
                width: 32, height: 32, borderRadius: "50%",
                border: "none", cursor: "pointer",
                background: isListening ? "#EF4444" : "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
                animation: isListening ? "pulse 1.5s infinite" : "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>

          {isListening && (
            <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", marginBottom: 12, fontWeight: 500 }}>
              Слушаю...
            </p>
          )}

          <BigBtn onClick={save}>
            Сохранить
          </BigBtn>
        </div>
      </Sheet>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
      `}</style>
    </>
  );
}
