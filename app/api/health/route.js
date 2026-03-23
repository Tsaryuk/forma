export const dynamic = "force-dynamic";

/**
 * GET /api/health?steps=X&wakeTime=HH:MM&bedTime=HH:MM&date=YYYY-MM-DD&token=XXX
 *
 * Вызывается из iOS Shortcuts автоматически.
 * Перенаправляет на приложение с параметрами — браузер обновляет данные в localStorage.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);

  const steps = searchParams.get("steps");
  const wakeTime = searchParams.get("wakeTime");
  const bedTime = searchParams.get("bedTime");
  const sleepStart = searchParams.get("sleepStart");
  const sleepEnd = searchParams.get("sleepEnd");
  const date = searchParams.get("date");

  const params = new URLSearchParams();
  params.set("health_import", "1");
  if (steps) params.set("steps", steps);
  if (wakeTime || sleepStart) params.set("wakeTime", wakeTime || sleepStart);
  if (bedTime || sleepEnd) params.set("bedTime", bedTime || sleepEnd);
  if (date) params.set("date", date);

  return Response.redirect(`${origin}/?${params.toString()}`, 302);
}

/**
 * POST /api/health
 * Body: { steps, wakeTime, bedTime, sleepStart, sleepEnd, date, token }
 *
 * Принимает данные от iOS Shortcuts или других клиентов.
 * Возвращает подтверждение — клиент должен записать данные сам (localStorage).
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { steps, wakeTime, bedTime, sleepStart, sleepEnd, date } = body;

  return Response.json({
    ok: true,
    imported: {
      steps: steps ? Number(steps) : null,
      wakeTime: wakeTime || sleepStart || null,
      bedTime: bedTime || sleepEnd || null,
      date: date || new Date().toISOString().slice(0, 10),
    },
  });
}
