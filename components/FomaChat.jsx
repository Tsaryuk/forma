"use client";
import { useState, useRef, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { askClaude } from "@/lib/helpers";
import { buildFomaContext, fomaSystemPrompt } from "@/lib/ai-context";
import { Card } from "@/components/ui";

export default function FomaChat({ userId, userName }) {
  const [messages, setMessages] = useLocalState("forma_chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(text) {
    if (!text?.trim() || loading) return;

    const userMsg = { role: "user", text: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const context = await buildFomaContext(userId);
      const system = fomaSystemPrompt(context);

      // Build conversation history (last 10 messages)
      const history = [...messages.slice(-10), userMsg].map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const reply = await askClaude({
        system,
        prompt: null,
        messages: history,
        max_tokens: 512,
      });

      setMessages(prev => [...prev, { role: "assistant", text: reply, ts: Date.now() }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Ошибка: " + err.message, ts: Date.now() }]);
    }
    setLoading(false);
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
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
        if (e.results[i].isFinal) finalText += t + " ";
        else interim = t;
      }
      setInput((finalText + interim).trim());
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (finalText.trim()) setInput(finalText.trim());
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  function stopVoice() {
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
    setIsListening(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  function clearChat() {
    setMessages([]);
  }

  const today = messages.filter(m => {
    const d = new Date(m.ts);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 10, padding: "0 2px",
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase" }}>
          Чат с Фомой
        </p>
        {today.length > 0 && (
          <button onClick={clearChat} style={{
            padding: "4px 10px", borderRadius: 8,
            border: "1px solid var(--border2)", background: "var(--surface2)",
            color: "var(--txt3)", fontSize: 10, cursor: "pointer",
          }}>
            Очистить
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 8,
        marginBottom: 12, maxHeight: 360,
        minHeight: 100,
      }}>
        {today.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "20px 16px" }}>
            <p style={{ fontSize: 13, color: "var(--txt3)", lineHeight: 1.6 }}>
              Спроси Фому о чём угодно: режим дня, питание, задачи, советы
            </p>
          </div>
        )}

        {today.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            <div style={{
              padding: "10px 14px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              background: msg.role === "user" ? "var(--accent)" : "var(--surface2)",
              color: msg.role === "user" ? "#fff" : "var(--txt)",
              fontSize: 14, lineHeight: 1.5,
              border: msg.role === "user" ? "none" : "1px solid var(--border)",
            }}>
              {msg.text}
            </div>
            <p style={{
              fontSize: 10, color: "var(--txt3)", marginTop: 3,
              textAlign: msg.role === "user" ? "right" : "left",
              padding: "0 4px",
            }}>
              {new Date(msg.ts).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        ))}

        {loading && (
          <div style={{
            alignSelf: "flex-start", maxWidth: "85%",
            padding: "10px 14px", borderRadius: "16px 16px 16px 4px",
            background: "var(--surface2)", border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--txt3)",
                  animation: `fomaDots 1.4s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        display: "flex", gap: 8, alignItems: "flex-end",
      }}>
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напиши Фоме..."
            rows={1}
            style={{
              width: "100%", padding: "11px 44px 11px 14px",
              borderRadius: 16, border: "1px solid var(--border2)",
              background: "var(--surface2)", color: "var(--txt)",
              fontSize: 14, outline: "none", resize: "none",
              fontFamily: "var(--font)", lineHeight: 1.4,
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={isListening ? stopVoice : startVoice}
            style={{
              position: "absolute", right: 6, bottom: 6,
              width: 32, height: 32, borderRadius: "50%",
              border: "none", cursor: "pointer",
              background: isListening ? "#EF4444" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: isListening ? "pulse 1.5s infinite" : "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isListening ? "#fff" : "var(--txt3)"} strokeWidth="2" strokeLinecap="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            width: 42, height: 42, borderRadius: 14,
            border: "none", background: "var(--accent)",
            color: "#fff", cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: !input.trim() || loading ? 0.4 : 1,
            flexShrink: 0,
            transition: "opacity .15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes fomaDots {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}
