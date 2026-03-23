// ─── Time helpers ─────────────────────────────────────────

/** Разница в минутах: (b - a). Положительное = b позже. */
export function timeDiffMin(a, b) {
  const [ah, am] = a.split(":").map(Number);
  const [bh, bm] = b.split(":").map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}

/** Форматирует минуты: "47мин" или "1ч 12мин" */
export function fmtMins(m) {
  const abs = Math.abs(m);
  if (abs < 60) return `${abs}мин`;
  const h = Math.floor(abs / 60);
  const min = abs % 60;
  return min > 0 ? `${h}ч ${min}мин` : `${h}ч`;
}

/** Добавляет часы к времени вида "HH:MM", возвращает "HH:MM" */
export function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ─── Score calculation ────────────────────────────────────

export function calcDailyScore(forms) {
  return forms.reduce((acc, f) => {
    // Meal score: count partial progress even before all meals are done
    if (f.type === "meal") {
      const done = (f.meals ?? []).filter(m => m.done).length;
      return acc + done * Math.round(f.pts / 3);
    }

    if (!f.checkedToday) return acc;

    if (f.type === "time") {
      const diff = timeDiffMin(f.target ?? "05:00", f.checkedAt ?? "09:00");
      const late = diff > 0;
      if (!late) return acc + f.pts; // early = full
      if (diff <= 15) return acc + Math.round(f.pts * 0.9);
      if (diff <= 30) return acc + Math.round(f.pts * 0.6);
      return acc + Math.round(f.pts * 0.2);
    }

    if (f.type === "duration") {
      const pct = Math.min(1, (f.logged ?? 0) / (f.target ?? 60));
      const noteBonus = f.note ? 1 : 0.5;
      return acc + Math.round(f.pts * pct * noteBonus);
    }

    if (f.type === "boolean") {
      return acc + (f.brokenToday ? 0 : f.pts);
    }

    if (f.type === "steps") {
      const pct = Math.min(1, (f.logged ?? 0) / (f.target ?? 20000));
      return acc + Math.round(f.pts * pct);
    }

    if (f.type === "limit") {
      return acc + ((f.spent ?? 0) <= (f.limitPerDay ?? 5000) ? f.pts : 0);
    }

    if (f.type === "weight") {
      return acc + (f.logged ? f.pts : 0);
    }

    if (f.type === "tasks") {
      const total = (f.tasks ?? []).filter(t => t.text).length;
      const done = (f.tasks ?? []).filter(t => t.done).length;
      if (!total) return acc;
      return acc + Math.round(f.pts * done / total);
    }

    return acc + f.pts;
  }, 0);
}

// ─── Category / type helpers ──────────────────────────────
import { CATS, FORM_TYPES } from "./data";

export const getCat  = (id) => CATS.find(c => c.id === id) ?? CATS[0];
export const getType = (id) => FORM_TYPES.find(t => t.id === id) ?? FORM_TYPES[3];

// ─── Date helpers ─────────────────────────────────────────

export function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function today() {
  return new Date();
}

// ─── AI helper ────────────────────────────────────────────

/**
 * Вызывает /api/ai (наш Vercel proxy).
 * system  — системный промпт (опционально)
 * prompt  — пользовательское сообщение
 * returns — строка с ответом Claude
 */
export async function askClaude({ system, prompt, messages: msgs, max_tokens = 1024 }) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens,
    messages: msgs || [{ role: "user", content: prompt }],
    ...(system && { system }),
  };

  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text ?? "";
}

/**
 * Распознаёт еду на фото через GPT-4o Vision.
 * image — base64 data URL (data:image/jpeg;base64,...)
 * Возвращает { dish, calories, protein, fat, carbs, description }
 */
export async function recognizeFood(image) {
  const res = await fetch("/api/vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return await res.json();
}
