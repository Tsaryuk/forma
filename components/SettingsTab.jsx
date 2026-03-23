"use client";
import { useState } from "react";
import { useLocalState } from "@/lib/hooks";

function Row({ label, hint, children }) {
  return (
    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--txt)" }}>{label}</p>
          {hint && <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt3)" }}>{hint}</p>}
        </div>
        <div style={{ flexShrink: 0 }}>{children}</div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ padding: "16px 16px 6px", fontSize: 11, fontWeight: 600, color: "var(--txt3)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
      {children}
    </div>
  );
}

export default function SettingsTab({ forms, setForms, theme, setTheme, userName, setUserName }) {
  const [nameEdit, setNameEdit] = useState(userName || "");
  const [openAiKey, setOpenAiKey] = useLocalState("forma_openai_key", "");
  const [keyEdit, setKeyEdit] = useState(openAiKey || "");
  const [saved, setSaved] = useState(false);

  function saveSettings() {
    setUserName(nameEdit.trim() || userName);
    setOpenAiKey(keyEdit.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const totalPts = forms.reduce((s, f) => s + (f.pts || 0), 0);
  const totalStreak = forms.reduce((s, f) => s + (f.streak || 0), 0);
  const longestStreak = Math.max(...forms.map(f => f.streak || 0), 0);

  return (
    <div className="fade-up">
      <SectionLabel>Профиль</SectionLabel>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--txt3)", fontWeight: 500 }}>Имя</p>
          <input
            type="text"
            value={nameEdit}
            onChange={e => setNameEdit(e.target.value)}
            placeholder="Ваше имя"
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 6,
              border: "1px solid var(--border)", background: "var(--surface2)",
              color: "var(--txt)", fontSize: 14, fontFamily: "inherit", outline: "none",
            }}
          />
        </div>
        <div style={{ padding: "14px 16px" }}>
          <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--txt3)", fontWeight: 500 }}>OpenAI API Key</p>
          <input
            type="password"
            value={keyEdit}
            onChange={e => setKeyEdit(e.target.value)}
            placeholder="sk-..."
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 6,
              border: "1px solid var(--border)", background: "var(--surface2)",
              color: "var(--txt)", fontSize: 14, fontFamily: "inherit", outline: "none",
            }}
          />
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--txt3)" }}>Для GPT-распознавания еды и AI-задач</p>
        </div>
      </div>

      <SectionLabel>Тема</SectionLabel>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        {[
          { id: "light", label: "Светлая" },
          { id: "dark",  label: "Тёмная" },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => setTheme(t.id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--txt)" }}>{t.label}</span>
            {theme === t.id && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>

      <SectionLabel>Статистика</SectionLabel>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Привычек", value: forms.length },
            { label: "Макс стрик", value: longestStreak },
            { label: "Всего очков", value: totalPts },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "14px 12px", textAlign: "center", borderRight: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.03em" }}>{value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--txt3)" }}>{label}</p>
            </div>
          ))}
        </div>
        {/* Habit list */}
        {forms.map(f => (
          <div key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: "1px solid var(--border)" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{f.name}</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--txt3)" }}>{f.principle}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: f.streak > 5 ? "var(--green)" : "var(--txt2)" }}>{f.streak || 0}д</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--txt3)" }}>стрик</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "16px" }}>
        <button
          onClick={saveSettings}
          style={{
            width: "100%", padding: "12px 16px",
            borderRadius: 6, border: "1px solid var(--txt)",
            background: saved ? "var(--green)" : "var(--txt)",
            color: saved ? "#fff" : "var(--bg)",
            fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
            transition: "background .2s",
          }}
        >
          {saved ? "Сохранено" : "Сохранить"}
        </button>
      </div>
    </div>
  );
}
