import { supabase } from "./supabase";

// ── Build full context for Foma AI ──────────────────────
export async function buildFomaContext(userId) {
  if (!supabase || !userId) return "Нет данных — userId не передан";

  // Load context entries (profile, goals, insights)
  const { data: context, error: ctxErr } = await supabase
    .from("ai_context")
    .select("*")
    .eq("user_id", userId);

  // If no context for this userId, try to find any context (small user base)
  let ctxData = context;
  if ((!ctxData || ctxData.length === 0) && !ctxErr) {
    const { data: anyCtx } = await supabase
      .from("ai_context")
      .select("*")
      .limit(20);
    ctxData = anyCtx;
  }

  // Profile section
  const profileFacts = (ctxData || [])
    .filter(c => c.key === "profile")
    .map(c => `- ${c.content}`)
    .join("\n");

  // Goals
  const goals = (ctxData || [])
    .filter(c => c.key === "goal")
    .map(c => `- ${c.content}`)
    .join("\n");

  // Insights
  const insights = (ctxData || [])
    .filter(c => c.key === "insight" || c.key === "pattern")
    .map(c => `- ${c.content}`)
    .join("\n");

  // Try loading today's data (ignore errors for missing tables)
  let todayMealsStr = "нет данных";
  let todayTasksStr = "нет задач";
  let todaySteps = 0;
  let diaryStr = "нет записей";

  try {
    const { data: meals } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", userId)
      .eq("date", todayStr());
    if (meals && meals.length > 0) {
      todayMealsStr = meals.map(m =>
        `${m.meal_type || "прием"}: ${m.description || "без описания"} (${m.calories || "?"} ккал)`
      ).join("\n  ");
    }
  } catch {}

  try {
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("date", todayStr());
    if (tasks && tasks.length > 0) {
      todayTasksStr = tasks.map(t => `${t.done ? "✓" : "○"} ${t.title}`).join("\n  ");
    }
  } catch {}

  try {
    const { data: diary } = await supabase
      .from("diary")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(3);
    if (diary && diary.length > 0) {
      diaryStr = diary.map(d =>
        `${d.date}: ${d.emotion || "?"} — ${(d.text || "").slice(0, 80)}`
      ).join("\n  ");
    }
  } catch {}

  return `ПРОФИЛЬ:
${profileFacts || "- Денис, разработчик"}

ЦЕЛИ:
${goals || "- Подъём 5:00, отбой 21:00, 20к шагов, 3 приема пищи, утреннее чтение"}

СЕГОДНЯ (${todayStr()}):
  Приемы пищи:
  ${todayMealsStr}
  Задачи:
  ${todayTasksStr}

ДНЕВНИК (последние записи):
  ${diaryStr}

ИНСАЙТЫ:
${insights || "- Пока мало данных для выводов"}`;
}

// ── Save AI insight back to Supabase ────────────────────
export async function saveAiInsight(userId, content) {
  if (!supabase || !userId) return;
  try {
    await supabase.from("ai_context").insert({
      user_id: userId,
      key: "insight",
      content,
      source: "app_ai",
    });
  } catch {}
}

// ── System prompt for Foma ──────────────────────────────
export function fomaSystemPrompt(userContext) {
  return `Ты Фома — персональный ассистент и друг. Ты живёшь в приложении Форма.

ХАРАКТЕР:
- Говоришь кратко, по делу, без воды
- Можешь использовать 1-2 emoji на сообщение
- Тон: тёплый но прямой, как близкий друг
- Если видишь проблему — говори честно
- Мотивируй без фальши и штампов
- Анализируй данные и давай конкретные советы

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
${userContext}

ПРАВИЛА:
- Отвечай на русском
- Не более 3-4 предложений в обычном ответе
- Если спрашивают анализ — можно длиннее
- Ссылайся на конкретные данные ("ты вчера лёг в 23:00, это на 2 часа позже цели")
- Если данных мало — не придумывай, скажи что пока собираем информацию
- Можешь предложить задачи на день, советы по питанию, режиму`;
}

// ── Meal analysis system prompt ─────────────────────────
export function mealAnalysisPrompt() {
  return `Ты нутрициолог-ассистент Фома. Анализируешь фото еды.

Твоя задача — из описания/фото определить:
1. Что за блюдо/продукты
2. Примерный вес порции
3. Калорийность (ккал)
4. БЖУ (белки, жиры, углеводы в граммах)
5. Краткий комментарий (что хорошо, что можно улучшить)

Отвечай строго в JSON:
{
  "dish": "название блюда",
  "weight_g": 300,
  "calories": 450,
  "protein": 25,
  "fat": 15,
  "carbs": 45,
  "fiber": 5,
  "comment": "Хороший баланс, но мало клетчатки. Добавь овощной салат.",
  "meal_type": "breakfast|lunch|dinner|snack"
}

Правила:
- Оценивай реалистично, не завышай и не занижай
- Если не уверен — дай диапазон в комментарии
- Пиши на русском
- Комментарий 1-2 предложения`;
}

// ── Daily nutrition summary prompt ──────────────────────
export function dailySummaryPrompt(mealsData) {
  return `Ты нутрициолог Фома. Проанализируй питание за день и дай рекомендации.

ПРИЕМЫ ПИЩИ ЗА СЕГОДНЯ:
${mealsData}

Ответь в JSON:
{
  "total_calories": число,
  "total_protein": число,
  "total_fat": число,
  "total_carbs": число,
  "rating": "отлично|хорошо|нормально|плохо",
  "summary": "Краткий итог дня",
  "recommendations": ["рек1", "рек2", "рек3"],
  "tomorrow_tip": "Один конкретный совет на завтра"
}`;
}

// ── Helpers ─────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
