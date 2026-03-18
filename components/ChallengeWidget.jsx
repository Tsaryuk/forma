"use client";
import { useState } from "react";
import { Card, Sheet, Pill, BigBtn, Field, TextInput, TimeInput } from "@/components/ui";
import { CHALLENGE_PRESETS, DEMO_CHALLENGE } from "@/lib/data";

// ── Create sheet ──────────────────────────────────────────
function CreateSheet({ open, onClose, onSave }) {
  const [step, setStep]         = useState(1);
  const [selected, setSelected] = useState(null);
  const [days, setDays]         = useState(3);
  const [customName, setCustomName] = useState("");
  const [inviting, setInviting] = useState([]);
  const FRIENDS = ["Василий", "Марина", "Лена", "Артём"];

  function reset() { setStep(1); setSelected(null); setDays(3); setCustomName(""); setInviting([]); }
  function handleClose() { reset(); onClose(); }
  const ch = CHALLENGE_PRESETS.find(c => c.id === selected);

  const startStr = new Date(Date.now() + (days - 1) * 86400000).toLocaleDateString("ru", { day: "numeric", month: "long" });

  return (
    <Sheet open={open} onClose={handleClose} title="Новый эксперимент" maxH="95vh">
      {step === 1 && <>
        <p style={{ fontSize: 13, color: "var(--txt2)", marginBottom: 16, lineHeight: 1.6 }}>
          Эксперимент — временный добровольный отказ. Не форма на всю жизнь, а проверка себя.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {CHALLENGE_PRESETS.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)} style={{ padding: "14px 12px", borderRadius: "var(--radius-sm)", textAlign: "left", cursor: "pointer", border: `1px solid ${selected === c.id ? c.color : "var(--border2)"}`, background: selected === c.id ? `${c.color}08` : "var(--surface2)", transition: "all .15s" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: selected === c.id ? c.color : "var(--txt)", marginBottom: 3 }}>{c.name}</div>
              <div style={{ fontSize: 11, color: "var(--txt3)", lineHeight: 1.4 }}>{c.desc}</div>
            </button>
          ))}
        </div>
        {selected === "custom" && (
          <div style={{ marginBottom: 16 }}>
            <Field label="Название"><TextInput value={customName} onChange={e => setCustomName(e.target.value)} placeholder="напр. Без мяса" /></Field>
          </div>
        )}
        <BigBtn onClick={() => setStep(2)} disabled={!selected || (selected === "custom" && !customName.trim())} color={ch?.color || "var(--txt)"}>
          {ch ? ch.name : "—"} →
        </BigBtn>
      </>}

      {step === 2 && ch && <>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px", borderRadius: "var(--radius-sm)", background: `${ch.color}08`, border: `1px solid ${ch.color}20`, marginBottom: 20 }}>
          <span style={{ fontSize: 26 }}>{ch.icon}</span>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, color: ch.color, margin: 0 }}>{ch.name}</p>
            <p style={{ fontSize: 12, color: "var(--txt2)", margin: 0 }}>{ch.desc}</p>
          </div>
        </div>

        <Field label="Сколько дней?">
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 5, 7, 14].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{ flex: 1, padding: "10px 0", borderRadius: "var(--radius-sm)", border: `1px solid ${days === d ? ch.color : "var(--border2)"}`, background: days === d ? `${ch.color}10` : "var(--surface2)", color: days === d ? ch.color : "var(--txt2)", fontSize: 14, fontWeight: days === d ? 600 : 400, cursor: "pointer", transition: "all .12s" }}>{d}</button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--txt3)", marginTop: 8 }}>Старт сегодня → финиш {startStr}</p>
        </Field>

        <Field label="Позвать друзей">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FRIENDS.map(f => (
              <label key={f} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: inviting.includes(f) ? `${ch.color}08` : "var(--surface2)", border: `1px solid ${inviting.includes(f) ? ch.color + "30" : "var(--border)"}`, cursor: "pointer", transition: "all .12s" }}>
                <input type="checkbox" checked={inviting.includes(f)} onChange={() => setInviting(i => i.includes(f) ? i.filter(x => x !== f) : [...i, f])} style={{ accentColor: ch.color, width: 15, height: 15 }} />
                <span style={{ fontSize: 14, fontWeight: 500, color: inviting.includes(f) ? ch.color : "var(--txt)" }}>{f}</span>
              </label>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep(1)} style={{ padding: "13px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>←</button>
          <BigBtn onClick={() => { onSave({ ...ch, days, friends: inviting }); reset(); }} color={ch.color}>
            Начать {days} {days === 1 ? "день" : days < 5 ? "дня" : "дней"}
          </BigBtn>
        </div>
      </>}
    </Sheet>
  );
}

// ── Confirm day sheet ─────────────────────────────────────
function ConfirmSheet({ open, onClose, ch, todayIdx, onConfirm }) {
  return (
    <Sheet open={open} onClose={onClose} title={`День ${todayIdx + 1}`}>
      <div style={{ textAlign: "center", padding: "24px 0 28px" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{ch?.icon}</div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic", color: "var(--txt)", marginBottom: 6 }}>
          Ты прожил день {ch?.name?.toLowerCase()}?
        </p>
        <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>{ch?.desc}</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <BigBtn onClick={onConfirm} color={ch?.color ?? "var(--green)"}>Да, выполнено</BigBtn>
        <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Нет</button>
      </div>
      <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--surface2)", fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>
        Нарушение — не провал. Запиши что случилось.
      </div>
    </Sheet>
  );
}

// ── CHALLENGE WIDGET ──────────────────────────────────────
export default function ChallengeWidget() {
  const [active, setActive]       = useState(DEMO_CHALLENGE);
  const [creating, setCreating]   = useState(false);
  const [confirming, setConfirming] = useState(false);

  const todayIdx = active.daysDone.length;
  const elapsed  = active.daysDone.filter(Boolean).length;
  const pct      = Math.round(elapsed / active.days * 100);
  const remaining = active.days - elapsed;

  function confirmDay() {
    setActive(a => ({ ...a, daysDone: [...a.daysDone, true] }));
    setConfirming(false);
  }

  return (
    <>
      {/* Active challenge */}
      <Card style={{ marginBottom: 10, background: `${active.color}05`, border: `1px solid ${active.color}20` }} pad="16px 18px">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${active.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {active.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 17, fontStyle: "italic", color: "var(--txt)" }}>{active.name}</span>
              <Pill color={active.color} bg={`${active.color}10`} small>Эксперимент</Pill>
            </div>
            <p style={{ fontSize: 12, color: "var(--txt2)" }}>{elapsed} из {active.days} · ост. {remaining}</p>
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: 26, fontStyle: "italic", fontWeight: 300, color: active.color }}>{pct}%</span>
        </div>

        {/* Day bubbles */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {Array.from({ length: active.days }, (_, i) => {
            const done = active.daysDone[i] === true;
            const isToday = i === todayIdx;
            return (
              <div key={i} style={{ flex: 1, padding: "8px 4px", borderRadius: "var(--radius-sm)", textAlign: "center", background: done ? active.color : isToday ? `${active.color}12` : "var(--surface2)", border: `1px solid ${done ? active.color : isToday ? `${active.color}40` : "var(--border)"}`, transition: "all .3s" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: done ? "#fff" : isToday ? active.color : "var(--txt3)", marginBottom: 1 }}>
                  {done ? "✓" : isToday ? "→" : "○"}
                </div>
                <div style={{ fontSize: 9, color: done ? "rgba(255,255,255,.6)" : "var(--txt3)" }}>{i + 1}</div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, borderRadius: 2, background: "var(--surface3)", overflow: "hidden", marginBottom: 14 }}>
          <div style={{ height: "100%", borderRadius: 2, background: active.color, width: `${pct}%`, transition: "width .6s ease" }} />
        </div>

        {/* Friends */}
        {active.friends.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ display: "flex" }}>
              {active.friends.map((f, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: 8, background: `${f.col}18`, border: `2px solid var(--surface)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: f.col, marginLeft: i > 0 ? -5 : 0 }}>
                  {f.init}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, color: "var(--txt2)" }}>
              {active.friends.filter(f => f.joined).map(f => f.name).join(", ")}
              {active.friends.filter(f => !f.joined).length > 0 ? ` · ${active.friends.filter(f => !f.joined).map(f => f.name).join(", ")} — приглашены` : ""}
            </span>
          </div>
        )}

        {/* CTA */}
        {todayIdx < active.days && !active.daysDone[todayIdx] ? (
          <button onClick={() => setConfirming(true)} style={{ width: "100%", padding: "11px", borderRadius: "var(--radius-sm)", border: "none", background: active.color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            День {todayIdx + 1} выполнен
          </button>
        ) : elapsed === active.days ? (
          <div style={{ padding: "11px", borderRadius: "var(--radius-sm)", background: "var(--green-bg)", border: "1px solid var(--green)", textAlign: "center" }}>
            <span style={{ color: "var(--green)", fontWeight: 600, fontSize: 13 }}>Эксперимент завершён</span>
          </div>
        ) : null}
      </Card>

      {/* New experiment */}
      <button onClick={() => setCreating(true)} style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s" }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}
      >
        <span style={{ fontSize: 15, fontWeight: 300 }}>+</span> Новый эксперимент
      </button>

      <ConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        ch={active}
        todayIdx={todayIdx}
        onConfirm={confirmDay}
      />
      <CreateSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSave={c => { setActive({ ...c, daysDone: [], startDate: new Date() }); setCreating(false); }}
      />
    </>
  );
}
