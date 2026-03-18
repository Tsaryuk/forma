"use client";
import { useState } from "react";
import { useTheme, useLocalState } from "@/lib/hooks";
import { calcDailyScore } from "@/lib/helpers";
import { DEFAULT_FORMS } from "@/lib/data";

import TodayTab       from "@/components/TodayTab";
import FeedTab        from "@/components/FeedTab";
import LeaderboardTab from "@/components/LeaderboardTab";
import ChallengeWidget from "@/components/ChallengeWidget";
import CalendarWidget  from "@/components/CalendarWidget";
import SettingsTab    from "@/components/SettingsTab";
import Onboarding    from "@/components/Onboarding";

// ── Nav icons ─────────────────────────────────────────────
function IconToday({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function IconFeed({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconStar({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} fillOpacity={active ? 0.1 : 0} stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
function IconExp({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
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
  { id: "today",     label: "Сегодня",   Icon: IconToday    },
  { id: "feed",      label: "Лента",     Icon: IconFeed     },
  { id: "leaders",   label: "Рейтинг",   Icon: IconStar     },
  { id: "exp",       label: "Опыты",     Icon: IconExp      },
  { id: "settings",  label: "Формы",     Icon: IconSettings },
];

// ── App ───────────────────────────────────────────────────
export default function App() {
  const { pref, setPref } = useTheme();
  const [tab, setTab] = useState("today");
  const [forms, setForms] = useLocalState("forma_forms", DEFAULT_FORMS);
  const [userName, setUserName] = useLocalState("forma_user", null);

  const score = calcDailyScore(forms);
  const [expTab, setExpTab] = useState("challenge");

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
            {userName?.[0]?.toUpperCase() || "Ф"}
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
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "10px 16px 100px" }}>

        {tab === "today" && (
          <TodayTab forms={forms} setForms={setForms} />
        )}

        {tab === "feed" && (
          <FeedTab />
        )}

        {tab === "leaders" && (
          <LeaderboardTab myScore={score} />
        )}

        {tab === "exp" && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[["challenge", "Эксперименты"], ["calendar", "Календарь"]].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setExpTab(id)}
                  style={{
                    flex: 1, padding: "8px 0",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    transition: "all .15s",
                    border: `1px solid ${expTab === id ? "var(--accent)" : "var(--border2)"}`,
                    background: expTab === id ? "var(--accent-bg)" : "transparent",
                    color: expTab === id ? "var(--accent)" : "var(--txt2)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {expTab === "challenge" && <ChallengeWidget />}
            {expTab === "calendar"  && <CalendarWidget />}
          </>
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
