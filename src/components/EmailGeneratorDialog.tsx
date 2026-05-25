import { useEffect, useState } from "react";
import { Sparkles, Copy, Save, Loader2, Mail } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { supabase, type Incubator, type Venture } from "@/lib/supabase";
import { generateEmail, type EmailKind } from "@/lib/ai";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function EmailGeneratorDialog({ open, onClose }: Props) {
  const { user } = useAuth();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [incubators, setIncubators] = useState<Incubator[]>([]);
  const [kind, setKind] = useState<EmailKind>("pre");
  const [ventureId, setVentureId] = useState<string>("");
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const [v, i] = await Promise.all([
        supabase.from("ventures").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("incubators").select("*").eq("user_id", user.id),
      ]);
      setVentures(((v.data ?? []) as Venture[]));
      setIncubators(((i.data ?? []) as Incubator[]));
    })();
  }, [open, user]);

  function reset() {
    setKind("pre");
    setVentureId("");
    setContext("");
    setResult(null);
  }

  async function handleGenerate() {
    const venture = ventures.find((v) => v.id === ventureId);
    if (!venture) {
      toast.error("Please select a venture.");
      return;
    }
    const incubator = venture.incubator_id
      ? incubators.find((i) => i.id === venture.incubator_id) ?? null
      : null;

    setGenerating(true);
    setResult(null);
    try {
      const res = await generateEmail({
        kind,
        venture: {
          name: venture.name,
          sector: venture.sector,
          stage: venture.stage,
          founder_name: venture.founder_name,
        },
        incubator: incubator
          ? { name: incubator.name, partner: incubator.partner }
          : null,
        context: context.trim() || undefined,
      });
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate email.";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraft() {
    if (!result || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("email_drafts").insert({
        user_id: user.id,
        venture_id: ventureId || null,
        kind,
        subject: result.subject,
        body: result.body,
      });
      if (error) throw error;
      toast.success("Draft saved.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save draft.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const text = `Subject: ${result.subject}\n\n${result.body}`;
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Generate Email with AI"
      description="Pre-sprint and post-sprint emails drafted by Gemini, tailored to the selected venture."
      size="xl"
    >
      <div className="space-y-5">
        {/* Kind toggle */}
        <div>
          <Label>Email Type</Label>
          <div className="flex gap-2">
            {(["pre", "post"] as EmailKind[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={
                  "flex flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors " +
                  (kind === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:bg-muted")
                }
              >
                <Mail className="h-4 w-4" />
                {k === "pre" ? "Pre-Sprint Email" : "Post-Sprint Email"}
              </button>
            ))}
          </div>
        </div>

        {/* Venture */}
        <div>
          <Label htmlFor="venture" required>
            Venture
          </Label>
          <select
            id="venture"
            value={ventureId}
            onChange={(e) => setVentureId(e.target.value)}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="">— Select a venture —</option>
            {ventures.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.sector ? ` · ${v.sector}` : ""}
                {v.stage ? ` · ${v.stage}` : ""}
              </option>
            ))}
          </select>
          {ventures.length === 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              No ventures yet — add one from the dashboard first.
            </p>
          )}
        </div>

        {/* Context */}
        <div>
          <Label htmlFor="context">
            Additional Context <span className="font-normal normal-case tracking-normal text-muted-foreground/70">(optional)</span>
          </Label>
          <Textarea
            id="context"
            rows={3}
            placeholder={
              kind === "pre"
                ? "e.g. focus on go-to-market readiness; founder is nervous about Q&A…"
                : "e.g. great session, next steps include intro to Sequoia, follow-up in 2 weeks…"
            }
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={handleGenerate} disabled={generating || !ventureId}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? "Drafting…" : "Generate with Gemini"}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={result.subject}
                onChange={(e) => setResult({ ...result, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                rows={12}
                value={result.body}
                onChange={(e) => setResult({ ...result, body: e.target.value })}
                className="font-mono text-[13px] leading-relaxed"
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Draft
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
