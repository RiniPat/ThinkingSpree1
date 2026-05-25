// Vercel Serverless Function: POST /api/generate-email
// Uses Google Gemini to draft pre-sprint or post-sprint emails.
// The GEMINI_API_KEY env var lives only on the server.

import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
  runtime: "edge",
};

type EmailKind = "pre" | "post";

type Body = {
  kind: EmailKind;
  venture: {
    name: string;
    sector?: string | null;
    stage?: string | null;
    founder_name?: string | null;
  };
  incubator?: { name: string; partner?: string | null } | null;
  context?: string;
};

function buildPrompt(b: Body): string {
  const kindLabel =
    b.kind === "pre"
      ? "PRE-SPRINT (before a strategic sprint session)"
      : "POST-SPRINT (after a strategic sprint session has concluded)";

  const ventureLine = [
    b.venture.name,
    b.venture.sector ? `sector: ${b.venture.sector}` : null,
    b.venture.stage ? `stage: ${b.venture.stage}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const incubatorLine = b.incubator
    ? `${b.incubator.name}${b.incubator.partner ? " (partnered with " + b.incubator.partner + ")" : ""}`
    : "an independent venture";

  const founder = b.venture.founder_name ?? "the founding team";

  const tone =
    b.kind === "pre"
      ? "warm, structured, and prescriptive — set clear expectations about session goals, prep needed, and outcomes the founder should walk away with."
      : "appreciative, action-oriented, and decisive — recap the key insights from the sprint, list concrete next steps with owners, and reaffirm the partnership.";

  return `You are a senior consultant at Thinking Spree, a venture-focused strategy firm.
Draft an email to send to a startup founder.

TYPE: ${kindLabel}

VENTURE
${ventureLine}

INCUBATOR / CONTEXT
${incubatorLine}

ADDRESSEE
${founder}

${b.context ? "ADDITIONAL CONTEXT FROM THE CONSULTANT\n" + b.context + "\n" : ""}
WRITING GUIDANCE
Tone: ${tone}
- Length: 140–220 words.
- Open with a personal, specific line — not generic pleasantries.
- Use short paragraphs. No bullet points unless absolutely needed.
- Sign off as "The Thinking Spree Team" unless context says otherwise.
- Do NOT use placeholders like [Founder Name] — use the real name "${founder}".

OUTPUT FORMAT — strict JSON, no markdown fences, no extra text:
{
  "subject": "...",
  "body": "..."
}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY is not set. Add it in your Vercel project env vars.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body?.venture?.name || (body.kind !== "pre" && body.kind !== "post")) {
    return new Response(
      JSON.stringify({ error: "Required: kind ('pre'|'post'), venture.name" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const genai = new GoogleGenerativeAI(apiKey);
    const model = genai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.75,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(buildPrompt(body));
    const text = result.response.text();

    // Parse JSON
    let parsed: { subject?: string; body?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      // best-effort cleanup if model wraps in fences anyway
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
      parsed = JSON.parse(cleaned);
    }

    if (!parsed.subject || !parsed.body) {
      return new Response(
        JSON.stringify({ error: "Model returned no subject/body", raw: text }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ subject: parsed.subject, body: parsed.body }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
