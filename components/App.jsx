"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme, useLocalState, useSupaSync } from "@/lib/hooks";
import { calcDailyScore } from "@/lib/helpers";
import { DEFAULT_FORMS } from "@/lib/data";

import TodayTab    from "@/components/TodayTab";
import DiaryTab    from "@/components/DiaryTab";
import CalendarTab from "@/components/CalendarTab";
import SettingsTab from "@/components/SettingsTab";

// ── Nav icons ──────────────────────────────────────────────
function IconToday({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconDiary({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  );
}
function IconCalendar({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function IconSettings({ active }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const TABS = [
  { id: "today",    label: "Сегодня",   Icon: IconToday },
  { id: "diary",    label: "Дневник",   Icon: IconDiary },
  { id: "calendar", label: "Календарь", Icon: IconCalendar },
  { id: "settings", label: "Настройки", Icon: IconSettings },
];

// ── App ───────────────────────────────────────────────────
export default function App() {
  const { pref, setPref } = useTheme();
  const [tab, setTab] = useState("today");
  const [forms, setForms] = useLocalState("forma_forms_v2", DEFAULT_FORMS);
  const [userName, setUserName] = useLocalState("forma_user", "");
  const { profile, ensureProfile, loadForms, saveForms, onIdsUpdated } = useSupaSync();
  const initialLoadDone = useRef(false);
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString("ru", {
      weekday: "long", day: "numeric", month: "long"
    }).replace(/^\w/, c => c.toUpperCase()));
  }, []);

  // Daily reset
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem("forma_forms_date_v2");
    if (saved !== today) {
      setForms(prev => prev.map(f => ({
        ...f,
        checkedToday: false,
        brokenToday: false,
        logged: f.type === "weight" ? f.logged : (f.type === "steps" || f.type === "duration" ? 0 : f.logged),
        ...(f.type === "meal" && f.meals
          ? { meals: f.meals.map(m => ({ ...m, done: false, time: null })), lastAt: null }
          : {}),
        ...(f.type === "tasks"
          ? { tasks: f.tasks.map(t => ({ ...t, done: false })) }
          : {}),
      })));
      localStorage.setItem("forma_forms_date_v2", today);
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

  const score = calcDailyScore(forms);
  const maxScore = forms.reduce((s, f) => s + (f.pts || 0), 0);
  const pct = maxScore > 0 ? Math.round(score / maxScore * 100) : 0;

  return (
    <div style={{
      minHeight: "100vh",
      maxWidth: 480,
      margin: "0 auto",
      background: "var(--bg)",
      padding: "0 0 80px",
      color: "var(--txt)",
    }}>
      {/* Header */}
      <header style={{
        padding: "16px 16px 0",
        borderBottom: "1px solid var(--border)",
        paddingBottom: 12,
        marginBottom: 0,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{
              margin: 0,
              fontSize: 12,
              color: "var(--txt3)",
              fontWeight: 400,
              marginBottom: 2,
            }}>{dateStr}</p>
            <h1 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: "-0.02em",
            }}>
              {userName ? `Привет, ${userName}` : "Привет"}
            </h1>
          </div>
          {/* Score badge */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
          }}>
            <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 400 }}>очки</span>
            <span style={{
              fontSize: 17,
              fontWeight: 700,
              color: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--gold)" : "var(--txt)",
              letterSpacing: "-0.02em",
            }}>{score}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{
          marginTop: 10,
          height: 2,
          background: "var(--border)",
          borderRadius: 1,
          overflow: "hidden",
        }}>
          <div style={{
            width: `${pct}%`,
            height: "100%",
            background: pct >= 80 ? "var(--green)" : pct >= 50 ? "var(--gold)" : "var(--accent)",
            borderRadius: 1,
            transition: "width 0.4s ease",
          }} />
        </div>
      </header>

      <div style={{ padding: "0" }}>
        {tab === "today"    && <TodayTab forms={forms} setForms={setForms} userId={profile?.id} userName={userName} />}
        {tab === "diary"    && <DiaryTab userName={userName} userId={profile?.id} />}
        {tab === "calendar" && <CalendarTab userId={profile?.id} userName={userName} forms={forms} />}
        {tab === "settings" && <SettingsTab forms={forms} setForms={setForms} theme={pref} setTheme={setPref} userName={userName} setUserName={setUserName} />}
      </div>

      {/* Bottom Nav */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        background: "var(--nav-bg)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}>
        <div style={{ display: "flex" }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)} style={{
                flex: 1,
                border: "none",
                background: "transparent",
                color: active ? "var(--txt)" : "var(--txt3)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "10px 4px 8px",
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                cursor: "pointer",
                transition: "color .15s",
                letterSpacing: 0,
                position: "relative",
              }}>
                {active && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 24,
                    height: 2,
                    background: "var(--txt)",
                    borderRadius: "0 0 2px 2px",
                  }} />
                )}
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
