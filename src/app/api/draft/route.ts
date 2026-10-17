import { NextResponse } from "next/server";

export const runtime = "nodejs";

function templateDraft(productName: string, usualDays: number, daysSinceLast: number) {
  return `It may be a good time to reorder ${productName}. You usually reorder about every ${usualDays} days, and it has been ${daysSinceLast} days since your last order. Feel free to revisit this reminder whenever it suits you.`;
}

function reviewDraft(draft: string, allowedNumbers: number[]) {
  const reasons: string[] = [];
  const words = draft.trim().split(/\s+/).filter(Boolean);
  if (words.length > 40) reasons.push("over the 40-word limit");
  const numbers = draft.match(/\b\d+(?:[,.]\d+)?%?\b/g) || [];
  if (numbers.some((value) => !allowedNumbers.includes(Number(value.replace(/,/g, "").replace("%", ""))))) reasons.push("includes a number outside the purchase evidence");
  if (/\b(?:discount|offer|sale|deal|free shipping|limited time|last chance|urgent|hurry|expires?|guarantee|save)\b|[£$€]/i.test(draft)) reasons.push("contains an unsupported promotion, price, or urgency claim");
  if (/\b(?:dear|hi|hello)\b/i.test(draft)) reasons.push("uses a greeting without a customer name in the purchase evidence");
  return { passed: reasons.length === 0, reasons };
}

export async function POST(request: Request) {
  const base = process.env.OPENAI_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  let input: { productName?: unknown; usualDays?: unknown; daysSinceLast?: unknown; daysLate?: unknown };
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
  const productName = typeof input.productName === "string" ? input.productName.slice(0, 140) : "a previously purchased item";
  const usualDays = Number(input.usualDays);
  const daysSinceLast = Number(input.daysSinceLast);
  const daysLate = Number(input.daysLate);
  if (![usualDays, daysSinceLast, daysLate].every(Number.isFinite)) return NextResponse.json({ error: "Missing purchase-timing evidence." }, { status: 400 });
  if (!base || !apiKey || !model || model.includes("the-model-id-from")) {
    return NextResponse.json({ draft: templateDraft(productName, usualDays, daysSinceLast), model: "Rhythm template", mode: "template", review: { status: "rules", reasons: [] } });
  }
  try {
    const response = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        // Gemma 4 can spend tokens in its separate reasoning channel before
        // producing the short customer-facing draft. Leave enough room for both.
        max_tokens: 512,
        messages: [
          { role: "system", content: "Write a concise, respectful, no-pressure reorder reminder in at most 40 words. Use only the facts provided. Do not invent discounts, availability, personal details, urgency, or a reason for the delay. Do not use a name. Invite the customer to ignore it if it is not useful." },
          { role: "user", content: JSON.stringify({ itemPreviouslyRepeated: productName, typicalRepeatIntervalDays: usualDays, daysSinceLastOrder: daysSinceLast, daysBeyondPersonalThreshold: daysLate }) },
        ],
      }),
      cache: "no-store",
    });
    const payload = await response.json();
    if (!response.ok) return NextResponse.json({ error: "LM Studio returned an error. Make sure the model is loaded and the local server is running." }, { status: 502 });
    const content = payload?.choices?.[0]?.message?.content;
    const draft = typeof content === "string" ? content.trim() : Array.isArray(content) ? content.map((part: { text?: string }) => part?.text || "").join("").trim() : "";
    if (!draft) return NextResponse.json({ error: "The model returned an empty draft. Try again or choose a different model." }, { status: 502 });
    const review = reviewDraft(draft, [usualDays, daysSinceLast, daysLate]);
    if (!review.passed) return NextResponse.json({ draft: templateDraft(productName, usualDays, daysSinceLast), model: "Rhythm template", mode: "verified_template", review: { status: "replaced", reasons: review.reasons } });
    return NextResponse.json({ draft, model, mode: "ai", review: { status: "passed", reasons: [] } });
  } catch {
    return NextResponse.json({ error: "Check that LM Studio is running and the model is loaded." }, { status: 502 });
  }
}
