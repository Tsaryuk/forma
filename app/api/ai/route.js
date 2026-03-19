// Allow large bodies for image uploads
export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export const maxDuration = 30;

/**
 * POST /api/ai
 *
 * Proxy между фронтендом и Claude API.
 * API-ключ хранится только здесь — никогда не попадает в браузер.
 * Поддерживает vision (base64 images в content).
 *
 * Body: стандартный Anthropic messages payload
 * { model, max_tokens, system?, messages, stream? }
 */
export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY не настроен. Добавь в Vercel → Settings → Environment Variables." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Всегда используем актуальную модель
  const payload = {
    model: body.model ?? "claude-sonnet-4-20250514",
    max_tokens: body.max_tokens ?? 1024,
    ...(body.system && { system: body.system }),
    messages: body.messages,
  };

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return Response.json(
        { error: data.error?.message ?? "Upstream error" },
        { status: upstream.status }
      );
    }

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
