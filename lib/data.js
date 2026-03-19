// ─── Form types ───────────────────────────────────────────
export const FORM_TYPES = [
  { id: "time",     label: "Время",        icon: "\u23F0", desc: "Фиксируешь конкретное время. Очки зависят от точности." },
  { id: "duration", label: "Длительность", icon: "\u23F1", desc: "Логируешь минуты. С заметкой — полные очки." },
  { id: "meal",     label: "Питание",      icon: "\uD83C\uDF7D", desc: "3 приёма с интервалом. Таймер и напоминания." },
  { id: "boolean",  label: "Да / Нет",     icon: "\u2713",  desc: "Сделал — нажал. Нарушил — рефлексия." },
  { id: "limit",    label: "Лимит",        icon: "\u25C9",  desc: "Задаёшь максимум. Не превышай." },
  { id: "steps",    label: "Шаги",         icon: "\uD83D\uDEB6", desc: "Считаешь шаги. Цель — дойти до нормы." },
  { id: "chain",    label: "Цепочка",      icon: "\uD83D\uDD17", desc: "Последовательность шагов. Все или ничего." },
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

// ─── Demo challenge ─────────────────────────────────────
export const DEMO_CHALLENGE = null;

// ─── Default forms (Denis personal) ──────────────────────
export const DEFAULT_FORMS = [
  {
    id: "f1",
    name: "Подъём",
    principle: "Ранний старт — основа дня",
    type: "time",
    cat: "body",
    pts: 100,
    target: "05:00",
    streak: 0,
    history: [],
    checkedToday: false,
    brokenToday: false,
    visible: "all",
    tg_remind: "04:45",
  },
  {
    id: "f2",
    name: "Отбой",
    principle: "Качественный сон = качественный день",
    type: "time",
    cat: "body",
    pts: 80,
    target: "21:00",
    streak: 0,
    history: [],
    checkedToday: false,
    brokenToday: false,
    visible: "all",
    tg_remind: "20:45",
  },
  {
    id: "f3",
    name: "Чтение",
    principle: "Думать, а не листать",
    type: "duration",
    cat: "mind",
    pts: 90,
    target: 60,
    logged: 0,
    note: "",
    streak: 0,
    history: [],
    checkedToday: false,
    visible: "all",
    tg_remind: "05:15",
  },
  {
    id: "f4",
    name: "Прогулка",
    principle: "Движение — лекарство от всего",
    type: "steps",
    cat: "body",
    pts: 80,
    target: 20000,
    logged: 0,
    streak: 0,
    history: [],
    checkedToday: false,
    visible: "all",
  },
  {
    id: "f5",
    name: "Питание",
    principle: "Стабильный сахар = стабильные реакции",
    type: "meal",
    cat: "body",
    pts: 90,
    intervalH: 4,
    meals: [
      { l: "Завтрак", done: false, time: null },
      { l: "Обед",    done: false, time: null },
      { l: "Ужин",    done: false, time: null },
    ],
    lastAt: null,
    streak: 0,
    history: [],
    checkedToday: false,
    visible: "all",
  },
];


// ─── Month names ──────────────────────────────────────────
export const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

export const WEEK_DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
