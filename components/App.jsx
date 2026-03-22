"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme, useLocalState, useSupaSync } from "@/lib/hooks";
import { calcDailyScore } from "@/lib/helpers";
import { DEFAULT_FORMS } from "@/lib/data";

import TodayTab       from "@/components/TodayTab";
import DiaryTab       from "@/components/DiaryTab";
import CalendarTab    from "@/components/CalendarTab";
import SettingsTab    from "@/components/SettingsTab";
import Onboarding     from "@/components/Onboarding";

// ── Nav icons ─────────────────────────────────────────────
function IconDashboard({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconDiary({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function IconCalendar({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconSettings({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

const TABS = [
  { id: "today",    label: "Главная",    Icon: IconDashboard },
  { id: "diary",    label: "Дневник",    Icon: IconDiary },
  { id: "calendar", label: "Календарь",  Icon: IconCalendar },
  { id: "settings", label: "Настройки",  Icon: IconSettings },
];

// ── App ───────────────────────────────────────────────────
export default function App() {
  const { pref, setPref } = useTheme();
  const [tab, setTab] = useState("today");
  const [forms, setForms] = useLocalState("forma_forms", DEFAULT_FORMS);
  const [userName, setUserName] = useLocalState("forma_user", null);
  const { profile, ensureProfile, loadForms, saveForms, onIdsUpdated } = useSupaSync();
  const initialLoadDone = useRef(false);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, c => c.toUpperCase()));
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("forma_forms_date");
    if (saved !== today) {
      setForms(prev => prev.map(f => ({
        ...f,
        checkedToday: false,
        brokenToday: false,
        logged: 0,
        spent: 0,
        ...(f.type === "meal" && f.meals
          ? { meals: f.meals.map(m => ({ ...m, done: false, time: null })), lastAt: null }
          : {}),
      })));
      localStorage.setItem("forma_forms_date", today);
    }
  }, []);

  useEffect(() => {
    onIdsUpdated.current = (idMap) => {
      setForms(fs => fs.map(f => idMap[f.id] ? { ...f, id: idMap[f.id] } : f));
    };
  }, []);

  useEffect(() => {
    if (!userName || initialLoadDone.current) return;
    initialLoadDone.current = true;

    (async () => {
      const p = await ensureProfile(userName);
      if (!p) return;
      const dbForms = await loadForms(p.id);
      if (dbForms && dbForms.length > 0) {
        setForms(dbForms);
      } else if (forms.length > 0) {
        saveForms(forms, p.id);
      }
    })();
  }, [userName]);

  useEffect(() => {
    if (profile?.id && initialLoadDone.current) {
      saveForms(forms, profile.id);
    }
  }, [forms, profile?.id]);

  if (!userName) {
    return <Onboarding onComplete={(name) => setUserName(name)} />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      maxWidth: 480,
      margin: "0 auto",
      background: "var(--bg)",
      padding: "14px 12px 92px",
      color: "var(--txt)",
    }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <p style={{ margin: 0, color: "var(--accent)", fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", fontWeight: 700 }}>Форма</p>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{dateStr}</h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--txt2)", fontWeight: 400 }}>
            Привет, {userName}
          </p>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 42, height: 42, borderRadius: 13,
          background: "var(--accent)", fontSize: 16, fontWeight: 700, color: "#fff",
          boxShadow: "0 2px 8px rgba(217,119,6,0.35)",
        }}>
          {userName?.[0]?.toUpperCase()}
        </div>
      </header>

      <div>
        {tab === "today" && <TodayTab forms={forms} setForms={setForms} userId={profile?.id} userName={userName} />}
        {tab === "diary" && <DiaryTab userName={userName} userId={profile?.id} />}
        {tab === "calendar" && <CalendarTab userId={profile?.id} userName={userName} forms={forms} />}
        {tab === "settings" && <SettingsTab forms={forms} setForms={setForms} theme={pref} setTheme={setPref} />}
      </div>

      <nav style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 28px)", maxWidth: 430, background: "var(--nav-bg)", border: "1px solid var(--border)", borderRadius: 18, padding: "6px", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", boxShadow: "var(--shadow-lg)", zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
          {TABS.map(({id,label,Icon}) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1, border: "none",
                background: active ? "var(--accent-bg)" : "transparent",
                color: active ? "var(--accent)" : "var(--txt2)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "8px 4px 7px",
                borderRadius: 12,
                fontSize: 10, fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "background .2s, color .2s",
              }}>
                <Icon active={active} />
                {label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
