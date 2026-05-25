import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog } from "@/components/Dialog";
import { Button, Input, Label } from "@/components/ui";
import { supabase, type Incubator } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export function AddVentureDialog({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [incubators, setIncubators] = useState<Incubator[]>([]);
  const [form, setForm] = useState({
    name: "",
    sector: "",
    stage: "",
    incubator_id: "",
    founder_name: "",
    founder_email: "",
  });

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("incubators")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => setIncubators((data ?? []) as Incubator[]));
  }, [open, user]);

  const reset = () =>
    setForm({
      name: "",
      sector: "",
      stage: "",
      incubator_id: "",
      founder_name: "",
      founder_email: "",
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Venture name is required.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("ventures").insert({
        user_id: user.id,
        name: form.name.trim(),
        sector: form.sector.trim() || null,
        stage: form.stage.trim() || null,
        incubator_id: form.incubator_id || null,
        founder_name: form.founder_name.trim() || null,
        founder_email: form.founder_email.trim() || null,
        status: "Active",
      });
      if (error) throw error;
      toast.success(`Venture "${form.name}" added.`);
      reset();
      onCreated?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add venture.";
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
      title="Add Venture"
      description="Add a new venture to your portfolio."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="vname" required>
            Venture Name
          </Label>
          <Input
            id="vname"
            placeholder="e.g. Lumen Diagnostics"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              placeholder="e.g. Healthtech"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="stage">Stage</Label>
            <Input
              id="stage"
              placeholder="e.g. Seed, Series A"
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="inc">Incubator</Label>
          <select
            id="inc"
            value={form.incubator_id}
            onChange={(e) => setForm({ ...form, incubator_id: e.target.value })}
            className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
          >
            <option value="">— None —</option>
            {incubators.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
                {i.partner ? ` · ${i.partner}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="fname">Founder Name</Label>
            <Input
              id="fname"
              placeholder="e.g. Asha Patel"
              value={form.founder_name}
              onChange={(e) => setForm({ ...form, founder_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="femail">Founder Email</Label>
            <Input
              id="femail"
              type="email"
              placeholder="founder@example.com"
              value={form.founder_email}
              onChange={(e) => setForm({ ...form, founder_email: e.target.value })}
            />
          </div>
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
            {saving ? "Adding…" : "Add Venture"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
