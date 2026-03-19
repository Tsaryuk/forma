import { supabase } from "./supabase";

// ── Build full context for Foma AI ──────────────────────
export async function buildFomaContext(userId) {
  if (!supabase || !userId) return "";

  const [
    { data: profile },
    { data: context },
    { data: checkins },
    { data: diary },
    { data: meals },
    { data: steps },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("ai_context").select("*").eq("user_id", userId),
    supabase.from("checkins").select("*").eq("user_id", userId).gte("date", weekAgo()).order("date", { ascending: false }),
    supabase.from("diary").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
    supabase.from("meals").select("*").eq("user_id", userId).eq("date", todayStr()),
    supabase.from("steps").select("*").eq("user_id", userId).eq("date", todayStr()).single(),
    supabase.from("tasks").select("*").eq("user_id", userId).eq("date", todayStr()),
  ]);

  // Profile section
  const profileFacts = (context || [])
    .filter(c => c.key === "profile" || c.key === "goal")
    .map(c => `- ${c.content}`)
    .join("\n");

  // Insights section
  const insights = (context || [])
    .filter(c => c.key === "insight" || c.key === "pattern")
    .map(c => `- ${c.content}`)
    .join("\n");

  // Today's data
  const todayMeals = (meals || []).map(m =>
    `${m.meal_type}: ${m.time ? new Date(m.time).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) : "?"} — ${m.description || "без описания"}`
  ).join("\n  ");

  const todayTasks = (tasks || []).map(t =>
    `${t.done ? "✓" : "○"} ${t.title}`
  ).join("\n  ");

  const todaySteps = steps?.count || 0;

  // Diary entries
  const diaryEntries = (diary || []).map(d =>
    `${d.date}: ${d.emotion || "?"} — ${(d.text || "").slice(0, 100)}`
  ).join("\n  ");

  return `ПРОФИЛЬ:
${profileFacts || "- Нет данных"}

ЦЕЛИ:
${(context || []).filter(c => c.key === "goal").map(c => `- ${c.content}`).join("\n") || "- Нет данных"}

СЕГОДНЯ (${todayStr()}):
  Шаги: ${todaySteps} / 20 000
  Приемы пищи:
  ${todayMeals || "нет данных"}
  Задачи:
  ${todayTasks || "нет задач"}

ПОСЛЕДНИЕ ЗАПИСИ ДНЕВНИКА:
  ${diaryEntries || "нет записей"}

ИНСАЙТЫ AI:
${insights || "- Пока нет инсайтов"}`;
}

// ── Save AI insight back to Supabase ────────────────────
export async function saveAiInsight(userId, content) {
  if (!supabase || !userId) return;
  await supabase.from("ai_context").upsert({
    user_id: userId,
    key: "insight",
    content,
    source: "app_ai",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,key,content" });
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
- Если данных мало — не придумывай, скажи что пока мало информации
- Можешь предложить задачи на день, советы по питанию, режиму`;
}

// ── Helpers ─────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function weekAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}
