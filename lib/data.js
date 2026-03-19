// ─── Form types ───────────────────────────────────────────
export const FORM_TYPES = [
  { id: "time",     label: "Время",        icon: "⏰", desc: "Фиксируешь конкретное время. Очки зависят от точности." },
  { id: "duration", label: "Длительность", icon: "⏱", desc: "Логируешь минуты. С заметкой — полные очки." },
  { id: "meal",     label: "Питание",      icon: "🍽", desc: "3 приёма с интервалом. Таймер и напоминания." },
  { id: "boolean",  label: "Да / Нет",     icon: "✓",  desc: "Сделал — нажал. Нарушил — рефлексия." },
  { id: "limit",    label: "Лимит",        icon: "◉",  desc: "Задаёшь максимум. Не превышай." },
  { id: "chain",    label: "Цепочка",      icon: "🔗", desc: "Последовательность шагов. Все или ничего." },
];

// ─── Categories ───────────────────────────────────────────
export const CATS = [
  { id: "body",      label: "Тело",     color: "#F97316" },
  { id: "mind",      label: "Разум",    color: "#6366F1" },
  { id: "finance",   label: "Финансы",  color: "#16A34A" },
  { id: "spirit",    label: "Дух",      color: "#D97706" },
  { id: "relations", label: "Люди",     color: "#EC4899" },
];

// ─── Challenge presets ────────────────────────────────────
export const CHALLENGE_PRESETS = [
  { id: "nomoney",  icon: "💸", name: "Без денег",    color: "#16A34A", desc: "Никаких трат. Ни карты, ни кэша." },
  { id: "nophone",  icon: "📵", name: "Без телефона", color: "#6366F1", desc: "Телефон выключен или вне доступа." },
  { id: "noalc",    icon: "🥃", name: "Без алкоголя", color: "#F97316", desc: "Ноль алкоголя весь период." },
  { id: "nosocial", icon: "🚫", name: "Без соцсетей", color: "#EC4899", desc: "Инстаграм, ТГ-каналы — не открывать." },
  { id: "nosugar",  icon: "🍬", name: "Без сахара",   color: "#D97706", desc: "Никакого добавленного сахара." },
  { id: "custom",   icon: "✦",  name: "Своё",         color: "#9333EA", desc: "Определи сам что исключаешь." },
];

// ─── Default forms (empty — user creates their own) ──────
export const DEFAULT_FORMS = [];


// ─── Month names ──────────────────────────────────────────
export const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

export const WEEK_DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
