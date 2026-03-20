"use client";
import { useState, useRef, useEffect } from "react";
import { useLocalState } from "@/lib/hooks";
import { supabase } from "@/lib/supabase";
import { askClaude } from "@/lib/helpers";
import { mealAnalysisPrompt, dailySummaryPrompt } from "@/lib/ai-context";
import { Card, Sheet, BigBtn } from "@/components/ui";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function timeStr() { return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }); }

const MEAL_LABELS = { breakfast: "Завтрак", lunch: "Обед", dinner: "Ужин", snack: "Перекус" };
const MEAL_ICONS = { breakfast: "\u2600\uFE0F", lunch: "\u{1F32E}", dinner: "\u{1F319}", snack: "\u{1F34E}" };

function MacroChip({ label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 8, background: `${color}12`, fontSize: 11 }}>
      <span style={{ fontWeight: 600, color }}>{label}</span>
      <span style={{ color: "var(--txt2)" }}>{value}г</span>
    </div>
  );
}

// ── Photo buttons (camera + gallery) ─────────────────────
function PhotoBtn({ onCapture, small }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  function handle(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 800;
        let w = img.width, h = img.height;
        if (w > max || h > max) { if (w > h) { h = h * max / w; w = max; } else { w = w * max / h; h = max; } }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        onCapture(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const btnStyle = {
    padding: small ? "8px 12px" : "12px 14px", borderRadius: "var(--radius-sm)",
    border: "1px dashed var(--border2)", background: "var(--surface2)",
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
    color: "var(--txt3)", fontSize: small ? 12 : 13, fontWeight: 500,
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handle} style={{ display: "none" }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handle} style={{ display: "none" }} />
      <button onClick={() => cameraRef.current?.click()} style={btnStyle}>
        <svg width={small ? 14 : 16} height={small ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        {small ? "Камера" : "Камера"}
      </button>
      <button onClick={() => galleryRef.current?.click()} style={btnStyle}>
        <svg width={small ? 14 : 16} height={small ? 14 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
        {small ? "Галерея" : "Галерея"}
      </button>
    </div>
  );
}

// ── Compact meal row inside the card ─────────────────────
function MealRow({ meal, onEdit, onDelete }) {
  const label = MEAL_LABELS[meal.meal_type] || "Прием";
  const icon = MEAL_ICONS[meal.meal_type] || "\u{1F37D}";
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 500, fontSize: 13, color: "var(--txt)" }}>{meal.dish}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            {meal.calories}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "var(--txt3)" }}>{meal.time}</span>
          <MacroChip label="Б" value={meal.protein} color="var(--blue)" />
          <MacroChip label="Ж" value={meal.fat} color="var(--gold)" />
          <MacroChip label="У" value={meal.carbs} color="var(--green)" />
        </div>
      </div>
      {meal.photo && (
        <img src={meal.photo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
      )}
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{
        width: 20, height: 20, borderRadius: 6, border: "none",
        background: "transparent", color: "var(--txt3)", cursor: "pointer",
        fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>x</button>
    </div>
  );
}

// ── Timer inside the card ────────────────────────────────
function TimerLine({ lastMealTime }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!lastMealTime) return;
    function update() {
      const next = new Date(new Date(lastMealTime).getTime() + 4 * 3600000);
      const diff = next.getTime() - Date.now();
      if (diff <= 0) { setRemaining("Пора есть!"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}ч ${m}мин до следующего`);
    }
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [lastMealTime]);

  if (!lastMealTime || !remaining) return null;
  const isTime = remaining === "Пора есть!";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "6px 10px", borderRadius: 8,
      background: isTime ? "var(--green-bg)" : "var(--surface2)",
      fontSize: 12, fontWeight: 500,
      color: isTime ? "var(--green)" : "var(--txt3)",
      marginTop: 8,
    }}>
      {isTime ? "\u2705" : "\u23F0"} {remaining}
    </div>
  );
}

// ── Main MealTracker Card ────────────────────────────────
export default function MealTracker({ userId }) {
  const [meals, setMeals] = useLocalState("forma_meals_today", []);
  const [showAdd, setShowAdd] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const [correction, setCorrection] = useState("");
  const [refining, setRefining] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [genSummary, setGenSummary] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("forma_meals_date");
    if (saved !== todayStr()) {
      setMeals([]);
      localStorage.setItem("forma_meals_date", todayStr());
    }
  }, []);

  const totalCal = meals.reduce((s, m) => s + (m.calories || 0), 0);
  const totalP = meals.reduce((s, m) => s + (m.protein || 0), 0);
  const totalF = meals.reduce((s, m) => s + (m.fat || 0), 0);
  const totalC = meals.reduce((s, m) => s + (m.carbs || 0), 0);
  const calPct = Math.min(100, Math.round(totalCal / 2200 * 100));
  const lastMealTime = meals.length > 0 ? meals[meals.length - 1].timestamp : null;

  function addPhoto(base64) {
    setPhotos(prev => [...prev, base64]);
  }

  function removePhoto(idx) {
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }

  async function analyze() {
    if (photos.length === 0 && !description.trim()) return;
    setAnalyzing(true);
    try {
      const content = [];
      photos.forEach(p => {
        content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.split(",")[1] } });
      });
      content.push({ type: "text", text: description.trim() || "Проанализируй эту еду на фото. Если несколько фото — это один приём пищи, суммируй всё." });

      const body = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: mealAnalysisPrompt(),
        messages: [{ role: "user", content }],
      };
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      setResult(JSON.parse(cleaned));
    } catch (err) {
      setResult({ dish: "Ошибка", calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0, comment: err.message, meal_type: "snack" });
    }
    setAnalyzing(false);
  }

  async function refineResult() {
    if (!correction.trim() || !result || refining) return;
    setRefining(true);
    try {
      const content = [];
      if (photos.length > 0) {
        photos.forEach(p => {
          content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.split(",")[1] } });
        });
      }
      content.push({ type: "text", text: `Предыдущий анализ: ${JSON.stringify(result)}\n\nУточнение от пользователя: ${correction.trim()}\n\nПересчитай с учетом уточнения. Ответь JSON в том же формате.` });

      const body = {
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        system: mealAnalysisPrompt(),
        messages: [{ role: "user", content }],
      };
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      setResult(JSON.parse(cleaned));
      setCorrection("");
    } catch (err) {
      console.error("Refine error:", err);
    }
    setRefining(false);
  }

  async function saveMeal() {
    if (!result) return;
    const meal = { ...result, time: timeStr(), timestamp: new Date().toISOString(), photo: photos[0] || null, date: todayStr() };

    if (editIdx !== null) {
      setMeals(prev => prev.map((m, i) => i === editIdx ? meal : m));
    } else {
      setMeals(prev => [...prev, meal]);
    }

    if (supabase && userId) {
      try {
        await supabase.from("meals").insert({
          user_id: userId, date: todayStr(), meal_type: result.meal_type || "snack",
          description: result.dish, calories: result.calories, protein: result.protein,
          fat: result.fat, carbs: result.carbs, ai_analysis: result, time: new Date().toISOString(),
        });
      } catch {}
    }

    closeSheet();
  }

  function deleteMeal(idx) {
    setMeals(prev => prev.filter((_, i) => i !== idx));
  }

  function openEdit(idx) {
    const meal = meals[idx];
    setEditIdx(idx);
    setDescription(meal.dish);
    setResult(meal);
    setPhotos(meal.photo ? [meal.photo] : []);
    setShowAdd(true);
  }

  function closeSheet() {
    setShowAdd(false);
    setPhotos([]);
    setDescription("");
    setResult(null);
    setEditIdx(null);
    setCorrection("");
  }

  async function genReport() {
    setGenSummary(true);
    try {
      const mealsStr = meals.map((m, i) =>
        `${i + 1}. ${MEAL_LABELS[m.meal_type] || "Прием"} (${m.time}): ${m.dish} — ${m.calories} ккал (Б:${m.protein} Ж:${m.fat} У:${m.carbs})`
      ).join("\n");
      const reply = await askClaude({ system: dailySummaryPrompt(mealsStr), prompt: "Анализ питания за день.", max_tokens: 512 });
      const cleaned = reply.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      setSummaryData(JSON.parse(cleaned));
    } catch (err) {
      setSummaryData({ summary: "Ошибка: " + err.message, recommendations: [], tomorrow_tip: "" });
    }
    setGenSummary(false);
    setShowSummary(true);
  }

  return (
    <>
      <Card style={{ borderLeft: "3px solid #F97316", marginBottom: 10 }} pad="16px 18px">
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: meals.length > 0 ? 8 : 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "#F9731612",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
          }}>
            {"\u{1F37D}"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: "var(--txt)" }}>Питание</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                {totalCal > 0 ? `${totalCal} ккал` : ""}
              </span>
            </div>
            {totalCal > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--surface3)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 2, background: calPct > 100 ? "var(--red)" : "#F97316", width: `${calPct}%`, transition: "width .5s" }} />
                </div>
                <span style={{ fontSize: 11, color: "var(--txt3)", fontWeight: 500, minWidth: 50, textAlign: "right" }}>
                  {meals.length} {meals.length === 1 ? "прием" : "приема"}
                </span>
              </div>
            )}
            {totalCal === 0 && (
              <p style={{ fontSize: 12, color: "var(--txt3)", margin: "2px 0 0" }}>Нет приемов пищи</p>
            )}
          </div>
        </div>

        {/* Macros summary */}
        {totalCal > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 58 }}>
            <MacroChip label="Б" value={totalP} color="var(--blue)" />
            <MacroChip label="Ж" value={totalF} color="var(--gold)" />
            <MacroChip label="У" value={totalC} color="var(--green)" />
          </div>
        )}

        {/* Meal rows */}
        {meals.length > 0 && (
          <div style={{ marginTop: 6 }}>
            {meals.map((meal, i) => (
              <MealRow key={i} meal={meal} onEdit={() => openEdit(i)} onDelete={() => deleteMeal(i)} />
            ))}
          </div>
        )}

        {/* Timer */}
        <TimerLine lastMealTime={lastMealTime} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => setShowAdd(true)} style={{
            flex: 1, padding: "10px", borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border2)", background: "var(--surface2)",
            color: "var(--txt)", fontSize: 13, fontWeight: 500, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            + Добавить
          </button>
          {meals.length >= 2 && (
            <button onClick={genReport} disabled={genSummary} style={{
              padding: "10px 14px", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--accent)", background: "var(--accent-bg)",
              color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: genSummary ? "wait" : "pointer",
              opacity: genSummary ? 0.6 : 1,
            }}>
              {genSummary ? "..." : "Отчет"}
            </button>
          )}
        </div>
      </Card>

      {/* Add/Edit sheet */}
      <Sheet open={showAdd} onClose={closeSheet} title={editIdx !== null ? "Редактировать" : "Добавить прием"}>
        {!result ? (
          <>
            {/* Photos */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                  <img src={p} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover" }} />
                  <button onClick={() => removePhoto(i)} style={{
                    position: "absolute", top: -6, right: -6,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "var(--red)", color: "#fff", border: "none",
                    fontSize: 10, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>x</button>
                </div>
              ))}
              <PhotoBtn onCapture={addPhoto} small={photos.length > 0} />
            </div>

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
                  width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)",
                  border: "1px solid var(--border2)", background: "var(--surface2)",
                  color: "var(--txt)", fontSize: 14, resize: "none", outline: "none",
                  fontFamily: "var(--font)", boxSizing: "border-box",
                }}
              />
            </div>
            <BigBtn onClick={analyze} disabled={(photos.length === 0 && !description.trim()) || analyzing} color="var(--accent)">
              {analyzing ? "Фома анализирует..." : "Анализировать"}
            </BigBtn>
          </>
        ) : (
          <>
            {/* Result preview */}
            <Card pad="14px 16px" style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{MEAL_ICONS[result.meal_type] || "\u{1F37D}"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: "var(--txt)" }}>{result.dish}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                      {result.calories} <span style={{ fontSize: 11, fontWeight: 400 }}>ккал</span>
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <MacroChip label="Б" value={result.protein} color="var(--blue)" />
                <MacroChip label="Ж" value={result.fat} color="var(--gold)" />
                <MacroChip label="У" value={result.carbs} color="var(--green)" />
                {result.fiber > 0 && <MacroChip label="Кл" value={result.fiber} color="var(--purple)" />}
              </div>
              {result.comment && (
                <div style={{ padding: "8px 12px", borderRadius: 10, background: "var(--accent-bg)", borderLeft: "3px solid var(--accent)" }}>
                  <p style={{ fontSize: 12, color: "var(--txt)", lineHeight: 1.5, margin: 0 }}>{result.comment}</p>
                </div>
              )}
              {photos.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {photos.map((p, i) => (
                    <img key={i} src={p} alt="" style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} />
                  ))}
                </div>
              )}
            </Card>

            {/* Refine with text */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={correction}
                  onChange={e => setCorrection(e.target.value)}
                  placeholder="Уточни: ещё был салат, хлеб..."
                  onKeyDown={e => e.key === "Enter" && correction.trim() && refineResult()}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border2)", background: "var(--surface2)",
                    color: "var(--txt)", fontSize: 13, outline: "none",
                    fontFamily: "var(--font)", boxSizing: "border-box",
                  }}
                />
                <button onClick={refineResult} disabled={!correction.trim() || refining} style={{
                  padding: "10px 14px", borderRadius: "var(--radius-sm)",
                  border: "none", background: "var(--accent)", color: "#fff",
                  fontSize: 12, fontWeight: 600, cursor: !correction.trim() || refining ? "not-allowed" : "pointer",
                  opacity: !correction.trim() || refining ? 0.5 : 1, whiteSpace: "nowrap",
                }}>
                  {refining ? "..." : "Дополнить"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setResult(null); setCorrection(""); }} style={{
                flex: 1, padding: "12px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border2)", background: "transparent",
                color: "var(--txt2)", fontSize: 13, cursor: "pointer",
              }}>
                Переснять
              </button>
              <BigBtn onClick={saveMeal} color="var(--green)">Сохранить</BigBtn>
            </div>
          </>
        )}
      </Sheet>

      {/* Summary sheet */}
      <Sheet open={showSummary} onClose={() => setShowSummary(false)} title="Отчет за день">
        {summaryData && (
          <div>
            <p style={{ fontSize: 14, color: "var(--txt)", lineHeight: 1.6, marginBottom: 14 }}>{summaryData.summary}</p>
            {summaryData.rating && (
              <div style={{
                padding: "8px 14px", borderRadius: 10,
                background: summaryData.rating === "отлично" || summaryData.rating === "хорошо" ? "var(--green-bg)" : "var(--accent-bg)",
                border: `1px solid ${summaryData.rating === "отлично" || summaryData.rating === "хорошо" ? "var(--green)" : "var(--accent)"}`,
                marginBottom: 14, textAlign: "center",
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: summaryData.rating === "отлично" || summaryData.rating === "хорошо" ? "var(--green)" : "var(--accent)" }}>
                  Оценка: {summaryData.rating}
                </span>
              </div>
            )}
            {summaryData.recommendations?.length > 0 && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--txt3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Рекомендации</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {summaryData.recommendations.map((r, i) => (
                    <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "var(--surface2)", fontSize: 13, color: "var(--txt)", lineHeight: 1.5 }}>{r}</div>
                  ))}
                </div>
              </>
            )}
            {summaryData.tomorrow_tip && (
              <div style={{ padding: "12px 14px", borderRadius: "var(--radius-sm)", background: "var(--accent-bg)", borderLeft: "3px solid var(--accent)" }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 4 }}>На завтра</p>
                <p style={{ fontSize: 13, color: "var(--txt)", lineHeight: 1.5, margin: 0 }}>{summaryData.tomorrow_tip}</p>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
