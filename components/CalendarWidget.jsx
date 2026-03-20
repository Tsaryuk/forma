"use client";
import { useState } from "react";
import { Card, Pill } from "@/components/ui";
import { askClaude } from "@/lib/helpers";
import { MONTH_NAMES, WEEK_DAYS } from "@/lib/data";

// ── Generate demo history ─────────────────────────────────
const TODAY = new Date();
const SAMPLE_NOTES = [
  "Встал вовремя, день прошёл продуктивно",
  "Сложно было с питанием — встреча затянулась",
  "Читал про системное мышление, много инсайтов",
  "Первый день эксперимента — тяжело, но ясно",
  "Хороший день. Всё по форме.",
  "Нарушил режим сна — засиделся до 23",
  "Поход в планах — нужно подготовить снаряжение",
];
const ALL_FORMS = ["Подъём", "Питание", "Чтение", "Без алкоголя", "Живу посредством"];

function generateHistory() {
  const h = {};
  for (let offset = 0; offset < 90; offset++) {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() - offset);
    const key = d.toISOString().slice(0, 10);
    const roll = Math.random();
    const done = ALL_FORMS.filter(() => Math.random() > 0.25);
    const broken = ALL_FORMS.filter(f => !done.includes(f) && Math.random() > 0.5);
    h[key] = {
      score: Math.floor(60 + Math.random() * 340),
      done,
      broken,
      challenge: roll > 0.85 ? { name: "День без телефона", success: Math.random() > 0.3 } : null,
      note: roll > 0.7 ? SAMPLE_NOTES[Math.floor(Math.random() * SAMPLE_NOTES.length)] : null,
    };
  }
  return h;
}

const HISTORY = generateHistory();

function scoreColor(s) {
  if (!s) return "var(--surface3)";
  if (s >= 300) return "var(--green)";
  if (s >= 200) return "var(--accent)";
  if (s >= 100) return "var(--gold)";
  return "var(--red)";
}

// ── Calendar ──────────────────────────────────────────────
export default function CalendarWidget() {
  const [viewDate, setViewDate] = useState({ year: TODAY.getFullYear(), month: TODAY.getMonth() });
  const [selected, setSelected] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [summaryKey, setSummaryKey] = useState(null);

  const { year, month } = viewDate;
  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthKey    = `${year}-${month}`;

  function dateKey(d) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  function isToday(d) { return year === TODAY.getFullYear() && month === TODAY.getMonth() && d === TODAY.getDate(); }
  function isFuture(d) { return new Date(year, month, d) > TODAY; }

  const selData = selected ? HISTORY[dateKey(selected)] : null;

  function prevMonth() {
    setViewDate(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
    setSelected(null); setAiSummary(null);
  }
  function nextMonth() {
    const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
    if (next.year > TODAY.getFullYear() || (next.year === TODAY.getFullYear() && next.month > TODAY.getMonth())) return;
    setViewDate(next);
    setSelected(null); setAiSummary(null);
  }

  async function generateSummary() {
    if (aiLoading || summaryKey === monthKey) return;
    setAiLoading(true);
    setAiSummary(null);

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (isFuture(d)) break;
      const dd = HISTORY[dateKey(d)];
      if (dd) days.push({ d, ...dd });
    }
    const avg = Math.round(days.reduce((a, d) => a + d.score, 0) / (days.length || 1));
    const best = [...days].sort((a, b) => b.score - a.score)[0];

    const prompt = `Ты — умный ассистент приложения "Форма". Напиши краткий аналитический саммари месяца на русском языке.

Данные за ${MONTH_NAMES[month]} ${year}:
- Активных дней: ${days.length} из ${daysInMonth}
- Средний балл: ${avg}
- Лучший день: ${best?.d || "—"} число (${best?.score || 0} очков)
- Среднее форм выполнено: ${(days.reduce((a, d) => a + d.done.length, 0) / (days.length || 1)).toFixed(1)} из ${ALL_FORMS.length}
- Среднее нарушений: ${(days.reduce((a, d) => a + d.broken.length, 0) / (days.length || 1)).toFixed(1)}

Напиши 3-4 предложения: что получилось, что нет, один практический совет. Без заголовков и списков. Тёплый и честный тон.`;

    try {
      const text = await askClaude({ prompt, max_tokens: 300 });
      setAiSummary(text);
      setSummaryKey(monthKey);
    } catch {
      setAiSummary("Не удалось загрузить анализ.");
    }
    setAiLoading(false);
  }

  return (
    <div>
      <Card pad="18px 18px 14px">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={prevMonth} style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{"‹"}</button>
          <span style={{ fontSize: 17, color: "var(--txt)" }}>{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} style={{ width: 30, height: 30, borderRadius: "var(--radius-sm)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, opacity: (month === TODAY.getMonth() && year === TODAY.getFullYear()) ? .3 : 1 }}>{"›"}</button>
        </div>

        {/* Weekdays */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, marginBottom: 4 }}>
          {WEEK_DAYS.map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, color: "var(--txt3)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{d}</div>
          ))}
        </div>

        {/* Days */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {Array.from({ length: startOffset }, (_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const day = HISTORY[dateKey(d)];
            const future = isFuture(d);
            const today = isToday(d);
            const sel = selected === d;
            const sc = day ? scoreColor(day.score) : "var(--surface3)";
            return (
              <div key={d} onClick={() => !future && setSelected(sel ? null : d)} style={{ aspectRatio: "1", borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: future ? "default" : "pointer", background: sel ? "var(--txt)" : today ? "var(--accent-bg)" : "var(--surface2)", border: `1px solid ${sel ? "var(--txt)" : today ? "var(--accent)" : "transparent"}`, transition: "all .12s", opacity: future ? .2 : 1, position: "relative" }}>
                <span style={{ fontSize: 12, fontWeight: today || sel ? 600 : 400, color: sel ? "#fff" : today ? "var(--accent)" : "var(--txt2)", lineHeight: 1 }}>{d}</span>
                {day && <div style={{ width: 4, height: 4, borderRadius: 1, marginTop: 2, background: sel ? "rgba(255,255,255,.5)" : sc }} />}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 14, marginTop: 12, justifyContent: "center" }}>
          {[["var(--green)", "300+"], ["var(--accent)", "200+"], ["var(--gold)", "100+"], ["var(--red)", "<100"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 1, background: c }} />
              <span style={{ fontSize: 10, color: "var(--txt3)" }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Selected day */}
      {selected && selData && (
        <Card style={{ marginTop: 8, animation: "fadeUp .2s ease" }} pad="15px 18px">
          <p style={{ fontSize: 16, color: "var(--txt)", marginBottom: 10 }}>
            {selected} {MONTH_NAMES[month].toLowerCase()} · {selData.score}
          </p>
          {selData.done.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Выполнено</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {selData.done.map(f => <Pill key={f} color="var(--green)" bg="var(--green-bg)" small>{f}</Pill>)}
              </div>
            </div>
          )}
          {selData.broken.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <p style={{ fontSize: 10, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>Нарушено</p>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {selData.broken.map(f => <Pill key={f} color="var(--red)" bg="var(--red-bg)" small>{f}</Pill>)}
              </div>
            </div>
          )}
          {selData.challenge && (
            <Pill color="var(--blue)" bg="var(--blue-bg)" small>{selData.challenge.name} {selData.challenge.success ? "✓" : "✗"}</Pill>
          )}
          {selData.note && (
            <p style={{ fontSize: 12, color: "var(--txt2)", marginTop: 10, lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 10 }}>«{selData.note}»</p>
          )}
        </Card>
      )}

      {/* AI Summary */}
      <div style={{ marginTop: 10 }}>
        {!aiSummary && !aiLoading && (
          <button onClick={generateSummary} style={{ width: "100%", padding: "12px", borderRadius: "var(--radius)", border: "1px solid var(--border2)", background: "transparent", color: "var(--txt2)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.color = "var(--blue)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = ""; e.currentTarget.style.color = ""; }}>
            AI-анализ {MONTH_NAMES[month].toLowerCase()}
          </button>
        )}

        {aiLoading && (
          <Card pad="16px 18px">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--blue)", animation: "pulse 1.5s infinite" }}>ai</div>
              <span style={{ fontSize: 13, color: "var(--txt2)" }}>Анализирую...</span>
            </div>
            {[100, 85, 92].map((w, i) => <div key={i} className="skeleton" style={{ height: 10, marginBottom: 8, width: `${w}%` }} />)}
          </Card>
        )}

        {aiSummary && !aiLoading && (
          <Card style={{ animation: "fadeUp .3s ease" }} pad="16px 18px">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: "var(--blue-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--blue)", fontWeight: 600 }}>ai</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--blue)", textTransform: "uppercase", letterSpacing: 1 }}>{MONTH_NAMES[month]} {year}</span>
              <button onClick={() => { setAiSummary(null); setSummaryKey(null); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--txt3)", cursor: "pointer", fontSize: 11 }}>обновить</button>
            </div>
            <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.75 }}>{aiSummary}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
