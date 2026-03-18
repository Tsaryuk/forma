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

// ─── Default forms (demo data) ────────────────────────────
export const DEFAULT_FORMS = [
  {
    id: "f1",
    name: "Подъём",
    principle: "Ранний старт структурирует весь день",
    type: "time",
    cat: "body",
    pts: 100,
    target: "05:00",
    streak: 14,
    history: Array(14).fill(1),
    checkedToday: false,
    brokenToday: false,
    visible: "streak",
    tg_remind: "04:45",
  },
  {
    id: "f2",
    name: "Питание",
    principle: "Стабильный сахар = стабильные реакции",
    type: "meal",
    cat: "body",
    pts: 90,
    intervalH: 4,
    meals: [
      { l: "Завтрак", done: true,  time: "08:30" },
      { l: "Обед",    done: false, time: null },
      { l: "Ужин",    done: false, time: null },
    ],
    lastAt: "08:30",
    streak: 47,
    history: Array(14).fill(1),
    checkedToday: false,
    visible: "all",
    tg_remind: null,
  },
  {
    id: "f3",
    name: "Чтение",
    principle: "Думать, а не листать",
    type: "duration",
    cat: "mind",
    pts: 70,
    target: 60,
    logged: 0,
    note: "",
    streak: 22,
    history: [1,1,0,1,1,1,1,1,0,1,1,1,1,1],
    checkedToday: false,
    visible: "all",
    tg_remind: "21:00",
  },
  {
    id: "f4",
    name: "Без алкоголя",
    principle: "Ясное сознание — основа всего",
    type: "boolean",
    cat: "spirit",
    pts: 80,
    streak: 6,
    history: [1,1,1,1,1,1,0,1,1,1,1,1,1,1],
    checkedToday: false,
    brokenToday: false,
    visible: "streak",
    tg_remind: null,
  },
  {
    id: "f5",
    name: "Живу посредством",
    principle: "Деньги — разница между заработанным и желаемым",
    type: "limit",
    cat: "finance",
    pts: 60,
    limitPerDay: 5000,
    spent: 0,
    streak: 31,
    history: Array(14).fill(1),
    checkedToday: false,
    visible: "streak",
    tg_remind: "20:00",
  },
];

// ─── Feed (demo) ──────────────────────────────────────────
export const DEMO_FEED = [
  {
    id: 1,
    who: "Василий", init: "ВЯ", col: "#FBBF24",
    time: "3 мин назад",
    formName: "Подъём", formType: "time", value: "04:58", exact: true,
    streak: 63,
    reactions: { fire: 14, strong: 5, brain: 0, hand: 0 },
  },
  {
    id: 2,
    who: "Марина", init: "МК", col: "#818CF8",
    time: "41 мин назад",
    formName: "Чтение", formType: "duration", value: "90 мин",
    note: "Поняла почему откладываю сложное на потом",
    streak: 32,
    reactions: { fire: 9, strong: 3, brain: 7, hand: 0 },
  },
  {
    id: 3,
    who: "Артём", init: "АС", col: "#F87171",
    time: "1ч назад",
    formName: "Холодный душ", formType: "boolean", broken: true,
    note: "Вчера поздно лёг, не успел до работы. Попробую сдвинуть на вечер",
    streak: 0,
    reactions: { fire: 0, strong: 0, brain: 0, hand: 6 },
  },
  {
    id: 4,
    who: "Лена", init: "ЛД", col: "#34D399",
    time: "2ч назад",
    formName: "Без алкоголя", formType: "boolean",
    streak: 20,
    reactions: { fire: 11, strong: 4, brain: 0, hand: 0 },
  },
];

// ─── Leaderboard (demo) ───────────────────────────────────
export const DEMO_LEADERBOARD = [
  { id: 1, name: "Василий", init: "ВЯ", col: "#FBBF24", pts: 3240, streak: 63, forms: 5, delta: 0,  me: false },
  { id: 2, name: "Марина",  init: "МК", col: "#818CF8", pts: 2910, streak: 32, forms: 4, delta: 1,  me: false },
  { id: 3, name: "Денис",   init: "Д",  col: "#F97316", pts: 2640, streak: 14, forms: 5, delta: -1, me: true  },
  { id: 4, name: "Лена",    init: "ЛД", col: "#34D399", pts: 2105, streak: 20, forms: 3, delta: 0,  me: false },
  { id: 5, name: "Артём",   init: "АС", col: "#F87171", pts: 1580, streak: 8,  forms: 5, delta: 2,  me: false },
];

// ─── Active challenge (demo) ──────────────────────────────
export const DEMO_CHALLENGE = {
  id: "nomoney", icon: "💸", name: "Без денег", color: "#16A34A",
  days: 3,
  startDate: new Date(Date.now() - 86400000), // yesterday
  daysDone: [true, true],                      // day1 + day2 complete
  friends: [
    { name: "Василий", init: "ВЯ", col: "#FBBF24", joined: true },
    { name: "Марина",  init: "МК", col: "#818CF8", joined: false },
  ],
};

// ─── Month names ──────────────────────────────────────────
export const MONTH_NAMES = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];

export const WEEK_DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
