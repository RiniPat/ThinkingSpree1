import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function AddIncubatorDialog({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    partner: "",
    location: "",
    cohort_size: "",
    start_date: "",
    notes: "",
  });

  const reset = () =>
    setForm({
      name: "",
      partner: "",
      location: "",
      cohort_size: "",
      start_date: "",
      notes: "",
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Incubator name is required.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("incubators").insert({
        user_id: user.id,
        name: form.name.trim(),
        partner: form.partner.trim() || null,
        location: form.location.trim() || null,
        cohort_size: form.cohort_size ? Number(form.cohort_size) : null,
        start_date: form.start_date || null,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;

      toast.success(`Incubator "${form.name}" added.`);
      reset();
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add incubator.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!saving) {
          reset();
          onClose();
        }
      }}
      title="Add Incubator"
      description="Track a new incubator program in your portfolio. Applies to all venture types."
      size="lg"
    >
      {/* Banner: "all" callout — replaces the removed 'type' selector */}
      <div className="mb-5 flex items-start gap-3 rounded-md border border-border bg-muted/40 px-4 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground">
          This incubator will accept{" "}
          <span className="font-medium text-foreground">ventures of all sectors and stages</span>.
          You can assign any venture to it later — no upfront type restriction.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name" required>
            Incubator Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. ISB i-Venture"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="partner">Partner / Anchor Institution</Label>
            <Input
              id="partner"
              placeholder="e.g. Indian School of Business"
              value={form.partner}
              onChange={(e) => setForm({ ...form, partner: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Hyderabad, India"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="cohort">Cohort Size</Label>
            <Input
              id="cohort"
              type="number"
              min={0}
              placeholder="e.g. 12"
              value={form.cohort_size}
              onChange={(e) => setForm({ ...form, cohort_size: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="start">Start Date</Label>
            <Input
              id="start"
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Anything worth remembering about this program…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!saving) {
                reset();
                onClose();
              }
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Adding…" : "Add Incubator"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
