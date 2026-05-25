// Client-side wrapper that calls our serverless /api/generate-email endpoint.
// The Gemini API key stays on the server (Vercel env var) — never exposed to the browser.

export type EmailKind = "pre" | "post";

export type GenerateEmailRequest = {
  kind: EmailKind;
  venture: {
    name: string;
    sector?: string | null;
    stage?: string | null;
    founder_name?: string | null;
  };
  incubator?: {
    name: string;
    partner?: string | null;
  } | null;
  context?: string;
};

export type GenerateEmailResponse = {
  subject: string;
  body: string;
};

export async function generateEmail(
  payload: GenerateEmailRequest
): Promise<GenerateEmailResponse> {
  const res = await fetch("/api/generate-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Email generation failed (${res.status}): ${txt || res.statusText}`);
  }

  return (await res.json()) as GenerateEmailResponse;
}
