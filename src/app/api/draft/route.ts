import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const base = process.env.OPENAI_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!base || !apiKey || !model || model.includes("the-model-id-from")) {
    return NextResponse.json({ error: "Local AI is not configured yet. Start LM Studio's server and add its model ID to .env.local." }, { status: 503 });
  }
  let input: { productName?: unknown; usualDays?: unknown; daysSinceLast?: unknown; daysLate?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Request body was not valid JSON." }, { status: 400 }); }
  const productName = typeof input.productName === "string" ? input.productName.slice(0, 140) : "a previously purchased item";
  const usualDays = Number(input.usualDays);
  const daysSinceLast = Number(input.daysSinceLast);
  const daysLate = Number(input.daysLate);
  if (![usualDays, daysSinceLast, daysLate].every(Number.isFinite)) return NextResponse.json({ error: "Missing purchase-timing evidence." }, { status: 400 });
  try {
    const response = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        max_tokens: 180,
        messages: [
          { role: "system", content: "Write a short, respectful, no-pressure customer follow-up for an independent retailer. Only use the evidence given. Do not invent a discount, product availability, personal details, urgency, or claims about why the person has not ordered. Do not use a name. Output only the draft message, with no quotation marks or analysis. Invite the customer to ignore it if it is not useful." },
          { role: "user", content: JSON.stringify({ itemPreviouslyRepeated: productName, typicalRepeatIntervalDays: usualDays, daysSinceLastOrder: daysSinceLast, daysBeyondPersonalThreshold: daysLate }) },
        ],
      }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: "LM Studio returned an error. Make sure the model is loaded and the local server is running." }, { status: 502 });
    const content = payload?.choices?.[0]?.message?.content;
    const draft = typeof content === "string" ? content.trim() : Array.isArray(content) ? content.map((part: { text?: string }) => part?.text || "").join("").trim() : "";
    if (!draft) return NextResponse.json({ error: "The model did not return a draft. Try again or choose a different model." }, { status: 502 });
    return NextResponse.json({ draft, model });
  } catch {
    return NextResponse.json({ error: "Could not reach the local model. Check that LM Studio's server is listening at the address in .env.local." }, { status: 502 });
  }
}
