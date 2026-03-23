export const maxDuration = 30;

/**
 * POST /api/vision
 *
 * Распознавание еды на фото через GPT-4o Vision.
 * Body: { image: "data:image/jpeg;base64,..." }
 * Returns: { dish, calories, protein, fat, carbs, description }
 */
export async function POST(request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY не настроен." },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { image, prompt: customPrompt } = body;
  if (!image) {
    return Response.json({ error: "image required" }, { status: 400 });
  }

  // Strip data URL prefix if present
  const base64 = image.replace(/^data:image\/\w+;base64,/, "");

  const systemPrompt = customPrompt || `Ты диетолог и нутрициолог. Посмотри на фото еды и определи:
1. Название блюда (кратко, по-русски)
2. Примерные калории (целое число, ккал)
3. Белки (г, целое)
4. Жиры (г, целое)
5. Углеводы (г, целое)
6. Краткое описание (1 предложение)

Отвечай ТОЛЬКО JSON без markdown:
{"dish":"...","calories":0,"protein":0,"fat":0,"carbs":0,"description":"..."}

Если блюд несколько — оцени всё вместе. Если еды нет на фото — верни {"dish":"Не еда","calories":0,"protein":0,"fat":0,"carbs":0,"description":"Еда не обнаружена"}`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: systemPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64}`,
                  detail: "low",
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return Response.json(
        { error: data.error?.message ?? "OpenAI error" },
        { status: upstream.status }
      );
    }

    const text = data.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return Response.json(parsed);
      }
    } catch {}

    return Response.json({ raw: text });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
