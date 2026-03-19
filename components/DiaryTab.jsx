"use client";
import { useState, useRef, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { askClaude } from "@/lib/helpers";
import { supabase } from "@/lib/supabase";
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

export default function DiaryTab({ userName, userId }) {
  const [entries, setEntries] = useLocalState("forma_diary", []);
  const [showNew, setShowNew] = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const recognitionRef = useRef(null);

  const todayEntry = entries.find(e => e.date === todayKey());
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Браузер не поддерживает распознавание речи"); return; }
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch(e) {} }
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let finalText = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += t + " ";
        } else {
          interim = t;
        }
      }
      const combined = (finalText + interim).trim();
      if (combined) {
        setText(prev => {
          const base = recognitionRef.current?._baseText ?? prev;
          return base ? base + " " + combined : combined;
        });
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (finalText.trim()) {
        setText(prev => {
          const base = recognitionRef.current?._baseText ?? "";
          return base ? base + " " + finalText.trim() : finalText.trim();
        });
      }
      setIsListening(false);
    };
    recognition._baseText = text;
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopVoice() {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    setIsListening(false);
  }

  async function analyzeEntry() {
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      const recentEntries = entries.slice(0, 5).map(e => {
        const em = EMOTIONS.find(x => x.id === e.emotion);
        return `${e.date}: ${em ? em.label : "?"} — ${e.text || "(без текста)"}`;
      }).join("\n");

      const result = await askClaude({
        system: `Ты Фома — персонаж приложения Форма, маленький заботливый друг пользователя ${userName || "Друг"}.
Твоя задача — дать короткий, тёплый ответ на запись дневника.
Формат ответа — строго JSON:
{
  "emotion": "great|good|neutral|bad|awful",
  "reply": "твой ответ (2-3 предложения, тёплый, с поддержкой или радостью)"
}

Правила:
- Определи настроение из текста (emotion)
- Ответ должен быть коротким, живым, без формальностей
- Если плохое настроение — поддержи, не обесценивай
- Если хорошее — порадуйся вместе
- Можешь ссылаться на прошлые записи если видишь паттерн
- Пиши на русском, можно 1 emoji`,
        prompt: `Последние записи:\n${recentEntries || "(первая запись)"}\n\nСегодняшняя запись:\n"${text}"`,
        max_tokens: 300,
      });

      try {
        const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.emotion && EMOTIONS.find(e => e.id === parsed.emotion)) {
          setEmotion(parsed.emotion);
        }
        if (parsed.reply) {
          setAiReply(parsed.reply);
        }
      } catch {
        setAiReply(result);
      }
    } catch (err) {
      setAiReply("Не удалось проанализировать: " + err.message);
    }
    setAnalyzing(false);
  }

  async function save() {
    if (!emotion && !text.trim()) return;
    const key = todayKey();
    const entry = {
      date: key,
      emotion: emotion,
      text: text.trim(),
      aiReply: aiReply || null,
      createdAt: new Date().toISOString(),
    };
    setEntries(prev => {
      const without = prev.filter(e => e.date !== key);
      return [entry, ...without];
    });

    // Save to Supabase
    if (supabase && userId) {
      await supabase.from("diary").insert({
        user_id: userId,
        date: key,
        text: entry.text,
        emotion: entry.emotion,
        ai_reply: entry.aiReply,
        voice: false,
      }).catch(console.error);
    }

    setShowNew(false);
    setEmotion(null);
    setText("");
    setAiReply("");
  }

  function openNew() {
    if (todayEntry) {
      setEmotion(todayEntry.emotion);
      setText(todayEntry.text);
      setAiReply(todayEntry.aiReply || "");
    } else {
      setEmotion(null);
      setText("");
      setAiReply("");
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: entry.text || entry.aiReply ? 8 : 0 }}>
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
              {entry.aiReply && (
                <div style={{
                  marginTop: 10, padding: "10px 12px",
                  borderRadius: 10,
                  background: "var(--accent-bg)",
                  borderLeft: "3px solid var(--accent)",
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>
                    Фома
                  </p>
                  <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.5, margin: 0 }}>
                    {entry.aiReply}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── New entry sheet ── */}
      <Sheet open={showNew} onClose={() => { setShowNew(false); stopVoice(); }} title={todayEntry ? "Изменить запись" : "Новая запись"}>
        <div style={{ padding: "0 4px" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", marginBottom: 8 }}>
            Что на уме?
          </p>
          <div style={{ position: "relative", marginBottom: 12 }}>
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
                width: 36, height: 36, borderRadius: "50%",
                border: "none", cursor: "pointer",
                background: isListening ? "#EF4444" : "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s",
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

          {isListening && (
            <p style={{ fontSize: 12, color: "#EF4444", textAlign: "center", marginBottom: 8, fontWeight: 500 }}>
              Слушаю...
            </p>
          )}

          {/* AI analyze button */}
          {text.trim() && !aiReply && (
            <button
              onClick={analyzeEntry}
              disabled={analyzing}
              style={{
                width: "100%", padding: "12px", marginBottom: 14,
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border2)",
                background: "var(--surface2)",
                color: "var(--txt)",
                fontSize: 13, fontWeight: 500,
                cursor: analyzing ? "wait" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: analyzing ? 0.6 : 1,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              {analyzing ? "Фома думает..." : "Спросить Фому"}
            </button>
          )}

          {/* AI reply */}
          {aiReply && (
            <div style={{
              marginBottom: 14, padding: "12px 14px",
              borderRadius: "var(--radius-sm)",
              background: "var(--accent-bg)",
              borderLeft: "3px solid var(--accent)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>Фома</span>
                <button
                  onClick={() => { setAiReply(""); analyzeEntry(); }}
                  disabled={analyzing}
                  style={{
                    padding: "2px 8px", borderRadius: 6,
                    border: "1px solid var(--border2)", background: "var(--surface)",
                    color: "var(--txt3)", fontSize: 10, cursor: "pointer",
                  }}
                >
                  {analyzing ? "..." : "Ещё"}
                </button>
              </div>
              <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.6, margin: 0 }}>
                {aiReply}
              </p>
            </div>
          )}

          {/* Emotion selector */}
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--txt2)", marginBottom: 8 }}>
            Настроение {emotion && aiReply ? "(Фома предложил)" : ""}
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
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
