"use client";
import { useState, useRef, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { askClaude } from "@/lib/helpers";
import { mealAnalysisPrompt, dailySummaryPrompt } from "@/lib/ai-context";
import { Card, Sheet, BigBtn, SectionLabel } from "@/components/ui";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function timeStr() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

const MEAL_LABELS = {
  breakfast: "Завтрак",
  lunch: "Обед",
  dinner: "Ужин",
  snack: "Перекус",
};

const MEAL_ICONS = {
  breakfast: "\u2600\uFE0F",
  lunch: "\u{1F32E}",
  dinner: "\u{1F319}",
  snack: "\u{1F34E}",
};

// ── Photo capture ────────────────────────────────────────
function PhotoCapture({ onCapture }) {
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      // Resize for API (max 800px)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxSize = 800;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = h * maxSize / w; w = maxSize; }
          else { w = w * maxSize / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        onCapture(base64);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%", padding: "20px", borderRadius: "var(--radius-sm)",
          border: "2px dashed var(--border2)", background: "var(--surface2)",
          cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 8,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--txt3)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span style={{ fontSize: 13, color: "var(--txt3)", fontWeight: 500 }}>
          Сфотографируй еду
        </span>
      </button>
    </div>
  );
}

// ── Meal result card ─────────────────────────────────────
function MealResultCard({ meal, compact }) {
  const label = MEAL_LABELS[meal.meal_type] || "Прием";
  const icon = MEAL_ICONS[meal.meal_type] || "\u{1F37D}";

  return (
    <Card pad="14px 16px" style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: compact ? 0 : 8 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: "var(--txt)" }}>
              {label} {meal.time && <span style={{ fontWeight: 400, color: "var(--txt3)", fontSize: 12 }}>{meal.time}</span>}
            </span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
              {meal.calories} <span style={{ fontSize: 11, fontWeight: 400 }}>ккал</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: "var(--txt2)", margin: "2px 0 0" }}>{meal.dish}</p>
        </div>
      </div>

      {!compact && (
        <>
          {/* Macros bar */}
          <div style={{ display: "flex", gap: 12, marginTop: 8, marginBottom: meal.comment ? 8 : 0 }}>
            <MacroChip label="Б" value={meal.protein} color="var(--blue)" />
            <MacroChip label="Ж" value={meal.fat} color="var(--gold)" />
            <MacroChip label="У" value={meal.carbs} color="var(--green)" />
            {meal.fiber > 0 && <MacroChip label="Кл" value={meal.fiber} color="var(--purple)" />}
          </div>

          {meal.comment && (
            <div style={{
              padding: "8px 12px", borderRadius: 10,
              background: "var(--accent-bg)",
              borderLeft: "3px solid var(--accent)",
            }}>
              <p style={{ fontSize: 12, color: "var(--txt)", lineHeight: 1.5, margin: 0 }}>
                {meal.comment}
              </p>
            </div>
          )}

          {meal.photo && (
            <img src={meal.photo} alt="meal" style={{
              width: "100%", height: 120, objectFit: "cover",
              borderRadius: 10, marginTop: 8,
            }} />
          )}
        </>
      )}
    </Card>
  );
}

function MacroChip({ label, value, color }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "4px 8px", borderRadius: 8,
      background: `${color}12`, fontSize: 12,
    }}>
      <span style={{ fontWeight: 600, color }}>{label}</span>
      <span style={{ color: "var(--txt2)" }}>{value}г</span>
    </div>
  );
}

// ── Daily summary ────────────────────────────────────────
function DailySummary({ meals }) {
  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalP = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalF = meals.reduce((s, m) => s + (m.fat || 0), 0);
  const totalC = meals.reduce((s, m) => s + (m.carbs || 0), 0);

  // Target: ~2200 kcal for active male
  const calPct = Math.min(100, Math.round(totalCal / 2200 * 100));

  return (
    <Card pad="16px" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--txt3)", textTransform: "uppercase", letterSpacing: 1 }}>
          Итого за день
        </span>
        <span style={{
          fontFamily: "var(--font-serif)", fontSize: 24, fontWeight: 300,
          fontStyle: "italic", color: "var(--txt)",
        }}>
          {totalCal} <span style={{ fontSize: 12, fontWeight: 400, color: "var(--txt3)" }}>/ 2200</span>
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 3, background: "var(--surface3)", marginBottom: 12, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          background: calPct > 100 ? "var(--red)" : calPct > 80 ? "var(--green)" : "var(--accent)",
          width: `${calPct}%`, transition: "width .5s ease",
        }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--blue)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>{totalP}</p>
          <p style={{ fontSize: 10, color: "var(--txt3)" }}>белки</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--gold)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>{totalF}</p>
          <p style={{ fontSize: 10, color: "var(--txt3)" }}>жиры</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--green)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>{totalC}</p>
          <p style={{ fontSize: 10, color: "var(--txt3)" }}>углеводы</p>
        </div>
      </div>
    </Card>
  );
}

// ── Timer pill ───────────────────────────────────────────
function NextMealTimer({ lastMealTime }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!lastMealTime) return;
    function update() {
      const last = new Date(lastMealTime);
      const next = new Date(last.getTime() + 4 * 60 * 60 * 1000);
      const diff = next.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Пора есть!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}ч ${m}мин`);
    }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [lastMealTime]);

  if (!lastMealTime) return null;

  const isTime = remaining === "Пора есть!";

  return (
    <div style={{
      padding: "8px 14px", borderRadius: 10,
      background: isTime ? "var(--green-bg)" : "var(--surface2)",
      border: `1px solid ${isTime ? "var(--green)" : "var(--border)"}`,
      display: "flex", alignItems: "center", gap: 8,
      marginBottom: 12,
    }}>
      <span style={{ fontSize: 14 }}>{isTime ? "\u2705" : "\u23F0"}</span>
      <span style={{ fontSize: 13, color: isTime ? "var(--green)" : "var(--txt2)", fontWeight: 500 }}>
        {isTime ? "Пора есть!" : `До следующего приема: ${remaining}`}
      </span>
    </div>
  );
}

// ── Main MealTracker ─────────────────────────────────────
export default function MealTracker({ userId, onMealLogged }) {
  const [meals, setMeals] = useLocalState("forma_meals_today", []);
  const [showAdd, setShowAdd] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [genSummary, setGenSummary] = useState(false);

  // Reset meals if day changed
  useEffect(() => {
    const saved = localStorage.getItem("forma_meals_date");
    if (saved !== todayStr()) {
      setMeals([]);
      localStorage.setItem("forma_meals_date", todayStr());
    }
  }, []);

  const lastMealTime = meals.length > 0 ? meals[meals.length - 1].timestamp : null;

  async function analyzePhoto() {
    if (!photo && !description.trim()) return;
    setAnalyzing(true);

    try {
      const content = [];
      if (photo) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: photo.split(",")[1] },
        });
      }
      content.push({
        type: "text",
        text: description.trim() || "Проанализируй это блюдо на фото",
      });

      const body = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: mealAnalysisPrompt(),
        messages: [{ role: "user", content }],
      };

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";

      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (err) {
      setResult({ dish: "Не удалось распознать", calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, comment: "Ошибка: " + err.message, meal_type: "snack" });
    }
    setAnalyzing(false);
  }

  async function saveMeal() {
    if (!result) return;
    const meal = {
      ...result,
      time: timeStr(),
      timestamp: new Date().toISOString(),
      photo: photo || null,
      date: todayStr(),
    };
    const updated = [...meals, meal];
    setMeals(updated);

    // Save to Supabase
    if (supabase && userId) {
      try {
        await supabase.from("meals").insert({
          user_id: userId,
          date: todayStr(),
          meal_type: result.meal_type || "snack",
          description: result.dish,
          calories: result.calories,
          protein: result.protein,
          fat: result.fat,
          carbs: result.carbs,
          ai_analysis: result,
          time: new Date().toISOString(),
        });
      } catch {}
    }

    if (onMealLogged) onMealLogged(meal);
    setShowAdd(false);
    setPhoto(null);
    setDescription("");
    setResult(null);
  }

  async function generateDaySummary() {
    setGenSummary(true);
    try {
      const mealsStr = meals.map((m, i) =>
        `${i + 1}. ${MEAL_LABELS[m.meal_type] || "Прием"} (${m.time}): ${m.dish} — ${m.calories} ккал (Б:${m.protein} Ж:${m.fat} У:${m.carbs})`
      ).join("\n");

      const reply = await askClaude({
        system: dailySummaryPrompt(mealsStr),
        prompt: "Сделай анализ питания за день и дай рекомендации.",
        max_tokens: 512,
      });

      const cleaned = reply.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      setSummaryData(JSON.parse(cleaned));
    } catch (err) {
      setSummaryData({ summary: "Не удалось сгенерировать отчет: " + err.message, recommendations: [], tomorrow_tip: "" });
    }
    setGenSummary(false);
    setShowSummary(true);
  }

  return (
    <>
      {/* Timer */}
      <NextMealTimer lastMealTime={lastMealTime} />

      {/* Today's summary if meals exist */}
      {meals.length > 0 && <DailySummary meals={meals} />}

      {/* Meal list */}
      {meals.map((meal, i) => (
        <MealResultCard key={i} meal={meal} compact />
      ))}

      {/* Add meal button */}
      <button
        onClick={() => setShowAdd(true)}
        style={{
          width: "100%", padding: "14px", borderRadius: "var(--radius-sm)",
          border: "2px dashed var(--border2)", background: "transparent",
          color: "var(--txt2)", fontSize: 14, fontWeight: 500,
          cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 8, marginBottom: 12,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Добавить прием пищи
      </button>

      {/* Day summary button */}
      {meals.length >= 2 && (
        <button
          onClick={generateDaySummary}
          disabled={genSummary}
          style={{
            width: "100%", padding: "12px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--accent)", background: "var(--accent-bg)",
            color: "var(--accent)", fontSize: 13, fontWeight: 600,
            cursor: genSummary ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            opacity: genSummary ? 0.6 : 1,
          }}
        >
          {genSummary ? "Анализирую..." : "Отчет за день"}
        </button>
      )}

      {/* Add meal sheet */}
      <Sheet open={showAdd} onClose={() => { setShowAdd(false); setPhoto(null); setResult(null); setDescription(""); }} title="Новый прием пищи">
        {!result ? (
          <>
            <PhotoCapture onCapture={setPhoto} />

            {photo && (
              <div style={{ marginBottom: 14 }}>
                <img src={photo} alt="preview" style={{
                  width: "100%", height: 180, objectFit: "cover",
                  borderRadius: "var(--radius-sm)",
                }} />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--txt3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 7 }}>
                Или опиши словами
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Гречка с курицей и салат..."
                rows={2}
                style={{
                  width: "100%", padding: "11px 14px",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border2)",
                  background: "var(--surface2)", color: "var(--txt)",
                  fontSize: 14, resize: "none", outline: "none",
                  fontFamily: "var(--font)", boxSizing: "border-box",
                }}
              />
            </div>

            <BigBtn
              onClick={analyzePhoto}
              disabled={(!photo && !description.trim()) || analyzing}
              color="var(--accent)"
            >
              {analyzing ? "Фома анализирует..." : "Анализировать"}
            </BigBtn>
          </>
        ) : (
          <>
            <MealResultCard meal={{ ...result, time: timeStr() }} />
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button
                onClick={() => { setResult(null); setPhoto(null); }}
                style={{
                  flex: 1, padding: "12px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border2)", background: "transparent",
                  color: "var(--txt2)", fontSize: 13, cursor: "pointer",
                }}
              >
                Переснять
              </button>
              <BigBtn onClick={saveMeal} color="var(--green)">
                Сохранить
              </BigBtn>
            </div>
          </>
        )}
      </Sheet>

      {/* Summary sheet */}
      <Sheet open={showSummary} onClose={() => setShowSummary(false)} title="Отчет за день">
        {summaryData && (
          <div>
            <p style={{ fontSize: 14, color: "var(--txt)", lineHeight: 1.6, marginBottom: 14 }}>
              {summaryData.summary}
            </p>

            {summaryData.rating && (
              <div style={{
                padding: "8px 14px", borderRadius: 10,
                background: summaryData.rating === "отлично" || summaryData.rating === "хорошо" ? "var(--green-bg)" : "var(--accent-bg)",
                border: `1px solid ${summaryData.rating === "отлично" || summaryData.rating === "хорошо" ? "var(--green)" : "var(--accent)"}`,
                marginBottom: 14, textAlign: "center",
              }}>
                <span style={{
                  fontSize: 14, fontWeight: 600,
                  color: summaryData.rating === "отлично" || summaryData.rating === "хорошо" ? "var(--green)" : "var(--accent)",
                }}>
                  Оценка: {summaryData.rating}
                </span>
              </div>
            )}

            {summaryData.recommendations?.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--txt3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  Рекомендации
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {summaryData.recommendations.map((r, i) => (
                    <div key={i} style={{
                      padding: "8px 12px", borderRadius: 8,
                      background: "var(--surface2)", fontSize: 13,
                      color: "var(--txt)", lineHeight: 1.5,
                    }}>
                      {r}
                    </div>
                  ))}
                </div>
              </>
            )}

            {summaryData.tomorrow_tip && (
              <div style={{
                padding: "12px 14px", borderRadius: "var(--radius-sm)",
                background: "var(--accent-bg)", borderLeft: "3px solid var(--accent)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>
                  На завтра
                </p>
                <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.5, margin: 0 }}>
                  {summaryData.tomorrow_tip}
                </p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
