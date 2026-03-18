# Форма

Социальный PWA-трекер осознанной дисциплины.

## Стек

- **Next.js 15** (App Router)
- **Vercel** — деплой + serverless functions
- **Claude API** — AI-аналитика через `/api/ai`

## Быстрый старт

```bash
npm install
cp .env.local.example .env.local
# вставь ANTHROPIC_API_KEY в .env.local
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

## Деплой на Vercel

1. Залей репо на GitHub
2. Import в [vercel.com](https://vercel.com)
3. Добавь переменную окружения:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`
4. Deploy

## Структура

```
forma/
├── app/
│   ├── api/ai/route.js     ← Vercel proxy → Claude API
│   ├── globals.css         ← CSS-переменные темы
│   ├── layout.jsx          ← PWA meta, fonts
│   └── page.jsx            ← Entry point
├── components/
│   ├── ui/index.jsx        ← Card, Sheet, Pill, Ring, BigBtn...
│   ├── App.jsx             ← Root, навигация, тема
│   ├── TodayTab.jsx        ← Чек-ин всех форм
│   ├── FeedTab.jsx         ← Лента друзей
│   ├── LeaderboardTab.jsx  ← Рейтинг
│   ├── ChallengeWidget.jsx ← Эксперименты
│   ├── CalendarWidget.jsx  ← Календарь + AI-саммари
│   └── SettingsTab.jsx     ← Управление формами + тема
├── lib/
│   ├── data.js             ← Константы и демо-данные
│   ├── helpers.js          ← Утилиты + askClaude()
│   └── hooks.js            ← useTheme, useLocalState
└── public/
    └── manifest.json       ← PWA manifest
```

## AI-аналитика

Вся интеграция с Claude идёт через `/api/ai`:

```js
// Пример вызова из любого компонента
import { askClaude } from "@/lib/helpers";

const text = await askClaude({
  prompt: "Проанализируй мои данные за месяц...",
  max_tokens: 300,
});
```

## Следующие шаги

- [ ] Supabase — auth + база данных (вместо localStorage)
- [ ] Telegram Login Widget + bot webhook
- [ ] Realtime лента (Supabase subscriptions)
- [ ] Push-уведомления (Web Push API)
- [ ] AI-анализ рефлексий раз в неделю
