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

      <SectionLabel>Apple Health</SectionLabel>
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ padding: "14px 16px" }}>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>
            Автоматический импорт шагов и сна
          </p>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>
            Создай автоматизацию в приложении <b>Быстрые команды</b> (iOS 13+), которая каждый вечер отправляет данные из Apple Health в Forma.
          </p>

          {/* Step 1 */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--txt)" }}>
              Шаг 1 — Создай команду
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>
              Приложение Быстрые команды → «+» → добавь действия:
            </p>
            <ol style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "var(--txt2)", lineHeight: 1.9 }}>
              <li>Здоровье → <b>Найти образцы здоровья</b> → Тип: Шаги, Сортировка: по дате (новые), Лимит: 1</li>
              <li>Переменные → <b>Получить значение из</b> → Шаги (сохрани в переменную «Steps»)</li>
              <li>Web → <b>Открыть URL</b> → вставь ссылку ниже</li>
            </ol>
          </div>

          {/* URL block */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--txt)" }}>
              Шаг 2 — URL для команды
            </p>
            <div
              onClick={() => {
                const url = `${window.location.origin}/api/health?steps={Steps}&date={Current Date}`;
                navigator.clipboard?.writeText(url);
              }}
              style={{ padding: "10px 12px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", cursor: "pointer" }}
            >
              <p style={{ margin: 0, fontSize: 11, color: "var(--txt2)", fontFamily: "monospace", lineHeight: 1.6, wordBreak: "break-all" }}>
                {typeof window !== "undefined" ? window.location.origin : "https://forma-black.vercel.app"}/api/health?steps=&#123;Steps&#125;&date=&#123;Current Date&#125;
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--accent)" }}>Нажми, чтобы скопировать</p>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--txt3)" }}>
              Замени <code style={{ background: "var(--surface2)", borderRadius: 3, padding: "0 4px" }}>&#123;Steps&#125;</code> и <code style={{ background: "var(--surface2)", borderRadius: 3, padding: "0 4px" }}>&#123;Current Date&#125;</code> на соответствующие переменные из Быстрых команд.
            </p>
          </div>

          {/* Sleep */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--txt)" }}>
              Шаг 3 — Добавь данные сна (опционально)
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>
              Добавь в URL параметры:
            </p>
            <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)" }}>
              <p style={{ margin: 0, fontSize: 11, fontFamily: "monospace", color: "var(--txt2)", lineHeight: 1.8 }}>
                &amp;wakeTime=&#123;Время подъёма, ЧЧ:ММ&#125;<br />
                &amp;bedTime=&#123;Время отбоя, ЧЧ:ММ&#125;
              </p>
            </div>
          </div>

          {/* Automation */}
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--txt)" }}>
              Шаг 4 — Автоматизация
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>
              Быстрые команды → Автоматизации → «+» → Время суток (например, 22:00) → выбери свою команду. Данные будут импортироваться каждый вечер автоматически.
            </p>
          </div>
        </div>
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
