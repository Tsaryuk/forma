"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme, useLocalState, useSupaSync } from "@/lib/hooks";
import { calcDailyScore } from "@/lib/helpers";
import { DEFAULT_FORMS } from "@/lib/data";

import TodayTab       from "@/components/TodayTab";
import DiaryTab       from "@/components/DiaryTab";
import CalendarTab    from "@/components/CalendarTab";
import SettingsTab    from "@/components/SettingsTab";
import Onboarding    from "@/components/Onboarding";

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
      maxWidth: 430, margin: "0 auto",
      minHeight: "100vh", background: "var(--bg)",
      position: "relative",
    }}>
      {/* ── Header ── */}
      <div style={{
        height: 54, background: "var(--bg)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ padding: "14px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600, color: "var(--accent)",
            boxShadow: "var(--shadow-sm)",
          }}>
            {userName?.[0]?.toUpperCase() || "Д"}
          </div>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "var(--txt)",
            letterSpacing: 0.2,
          }}>
            {new Date().toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" }).replace(/^\w/, c => c.toUpperCase())}
          </span>
          <div style={{
            width: 34, height: 34, borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-sm)",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--txt2)" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "10px 16px 100px" }}>

        {tab === "today" && (
          <TodayTab forms={forms} setForms={setForms} userId={profile?.id} userName={userName} />
        )}

        {tab === "diary" && (
          <DiaryTab userName={userName} userId={profile?.id} />
        )}

        {tab === "calendar" && (
          <CalendarTab userId={profile?.id} userName={userName} forms={forms} />
        )}

        {tab === "settings" && (
          <SettingsTab
            forms={forms}
            setForms={setForms}
            theme={pref}
            setTheme={setPref}
          />
        )}
      </div>

      {/* ── Bottom nav (floating) ── */}
      <nav style={{
        position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)",
        width: "calc(100% - 32px)", maxWidth: 398,
        background: "var(--nav-bg)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "var(--shadow-lg)",
        zIndex: 99,
      }}>
        <div style={{ display: "flex", padding: "6px 4px" }}>
          {TABS.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, border: "none", cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "8px 0",
                  color: active ? "var(--accent)" : "var(--txt3)",
                  background: active ? "var(--accent-bg)" : "transparent",
                  borderRadius: 14,
                  transition: "all .2s",
                }}
              >
                <Icon active={active} />
                <span style={{
                  fontSize: 9, fontWeight: active ? 600 : 400,
                  letterSpacing: 0.3,
                }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
