"use client";
import { useState } from "react";
import { useLocalState } from "@/lib/hooks";
import { Card, Sheet, Pill, BigBtn, Field, TextInput } from "@/components/ui";
import { CHALLENGE_PRESETS } from "@/lib/data";

function CreateSheet({ open, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [days, setDays] = useState(3);
  const [customName, setCustomName] = useState("");

  function reset() { setStep(1); setSelected(null); setDays(3); setCustomName(""); }
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
            <p style={{ fontWeight: 600, fontSize: 15, color: ch.color, margin: 0 }}>{selected === "custom" ? customName : ch.name}</p>
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

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setStep(1)} style={{ padding: "13px 18px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>←</button>
          <BigBtn onClick={() => { onSave({ id: crypto.randomUUID(), name: selected === "custom" ? customName : ch.name, icon: ch.icon, color: ch.color, desc: ch.desc, days, daysDone: [], startDate: new Date().toISOString() }); reset(); }} color={ch.color}>
            Начать {days} {days === 1 ? "день" : days < 5 ? "дня" : "дней"}
          </BigBtn>
        </div>
      </>}
    </Sheet>
  );
}

function ConfirmSheet({ open, onClose, ch, todayIdx, onConfirm }) {
  if (!ch) return null;
  return (
    <Sheet open={open} onClose={onClose} title={`День ${todayIdx + 1}`}>
      <div style={{ textAlign: "center", padding: "24px 0 28px" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>{ch.icon}</div>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontStyle: "italic", color: "var(--txt)", marginBottom: 6 }}>
          Ты прожил день {ch.name?.toLowerCase()}?
        </p>
        <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>{ch.desc}</p>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <BigBtn onClick={onConfirm} color={ch.color ?? "var(--green)"}>Да, выполнено</BigBtn>
        <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>Нет</button>
      </div>
      <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--surface2)", fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>
        Нарушение — не провал. Запиши что случилось.
      </div>
    </Sheet>
  );
}

function ExperimentCard({ exp, onConfirm, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const todayIdx = exp.daysDone.length;
  const elapsed = exp.daysDone.filter(Boolean).length;
  const pct = Math.round(elapsed / exp.days * 100);
  const remaining = exp.days - elapsed;
  const finished = elapsed >= exp.days;

  return (
    <>
      <Card style={{ marginBottom: 10, background: `${exp.color}05`, border: `1px solid ${exp.color}20` }} pad="14px 16px">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${exp.color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {exp.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--txt)" }}>{exp.name}</span>
              {finished && <Pill color="var(--green)" bg="var(--green-bg)" small>Done</Pill>}
            </div>
            <p style={{ fontSize: 12, color: "var(--txt2)", margin: 0 }}>{elapsed} из {exp.days} · ост. {remaining}</p>
          </div>
          <span style={{ fontSize: 22, fontWeight: 600, color: exp.color }}>{pct}%</span>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
          {Array.from({ length: exp.days }, (_, i) => {
            const done = exp.daysDone[i] === true;
            const isToday = i === todayIdx;
            return (
              <div key={i} style={{ flex: 1, padding: "6px 2px", borderRadius: 8, textAlign: "center", background: done ? exp.color : isToday ? `${exp.color}12` : "var(--surface2)", border: `1px solid ${done ? exp.color : isToday ? `${exp.color}40` : "var(--border)"}`, transition: "all .3s" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: done ? "#fff" : isToday ? exp.color : "var(--txt3)" }}>
                  {done ? "✓" : isToday ? "→" : "○"}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 3, borderRadius: 2, background: "var(--surface3)", overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", borderRadius: 2, background: exp.color, width: `${pct}%`, transition: "width .6s ease" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {!finished && todayIdx < exp.days && !exp.daysDone[todayIdx] && (
            <button onClick={() => setConfirming(true)} style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-sm)", border: "none", background: exp.color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              День {todayIdx + 1} выполнен
            </button>
          )}
          {finished && (
            <div style={{ flex: 1, padding: "10px", borderRadius: "var(--radius-sm)", background: "var(--green-bg)", border: "1px solid var(--green)", textAlign: "center" }}>
              <span style={{ color: "var(--green)", fontWeight: 600, fontSize: 13 }}>Завершён</span>
            </div>
          )}
          <button onClick={() => onDelete(exp.id)} style={{ padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt3)", fontSize: 12, cursor: "pointer" }}>
            ✕
          </button>
        </div>
      </Card>

      <ConfirmSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        ch={exp}
        todayIdx={todayIdx}
        onConfirm={() => { onConfirm(exp.id); setConfirming(false); }}
      />
    </>
  );
}

export default function ChallengeWidget() {
  const [experiments, setExperiments] = useLocalState("forma_experiments", []);
  const [creating, setCreating] = useState(false);

  function addExperiment(exp) {
    setExperiments(prev => [...prev, exp]);
    setCreating(false);
  }

  function confirmDay(id) {
    setExperiments(prev => prev.map(e =>
      e.id === id ? { ...e, daysDone: [...e.daysDone, true] } : e
    ));
  }

  function deleteExperiment(id) {
    setExperiments(prev => prev.filter(e => e.id !== id));
  }

  const active = experiments.filter(e => e.daysDone.length < e.days);
  const finished = experiments.filter(e => e.daysDone.length >= e.days);

  return (
    <>
      {experiments.length === 0 && (
        <Card style={{ textAlign: "center", padding: "28px 16px", marginBottom: 12 }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>🧪</p>
          <p style={{ fontSize: 14, color: "var(--txt2)", lineHeight: 1.6 }}>
            Эксперименты — временные вызовы самому себе. Можно вести несколько одновременно.
          </p>
        </Card>
      )}

      {active.map(exp => (
        <ExperimentCard key={exp.id} exp={exp} onConfirm={confirmDay} onDelete={deleteExperiment} />
      ))}

      {finished.length > 0 && (
        <>
          <p style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", margin: "16px 0 8px 2px" }}>Завершённые</p>
          {finished.map(exp => (
            <ExperimentCard key={exp.id} exp={exp} onConfirm={confirmDay} onDelete={deleteExperiment} />
          ))}
        </>
      )}

      <button onClick={() => setCreating(true)} style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 13, fontWeight: 500, cursor: "pointer", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s" }}>
        <span style={{ fontSize: 15, fontWeight: 300 }}>+</span> Новый эксперимент
      </button>

      <CreateSheet
        open={creating}
        onClose={() => setCreating(false)}
        onSave={addExperiment}
      />
    </>
  );
}
