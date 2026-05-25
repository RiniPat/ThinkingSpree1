import { useEffect, useMemo, useState } from "react";
import logo from "@/assets/thinkingspree-logo.jpg";
import {
  LayoutDashboard,
  Users,
  Rocket,
  ClipboardList,
  FileSpreadsheet,
  Settings,
  Search,
  Bell,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ChevronRight,
  Building2,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase, type Incubator, type Venture } from "@/lib/supabase";
import { Button } from "@/components/ui";
import { AddIncubatorDialog } from "@/components/AddIncubatorDialog";
import { AddVentureDialog } from "@/components/AddVentureDialog";
import { EmailGeneratorDialog } from "@/components/EmailGeneratorDialog";

const nav = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Ventures", icon: Users },
  { label: "T-Sprints", icon: Rocket },
  { label: "Sprint Tracking", icon: ClipboardList },
  { label: "Summary Sheet", icon: FileSpreadsheet },
  { label: "Settings", icon: Settings },
];

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: typeof CheckCircle2 }> = {
    Completed: {
      cls: "bg-[oklch(0.95_0.04_160)] text-[oklch(0.35_0.08_160)] border-[oklch(0.85_0.06_160)]",
      icon: CheckCircle2,
    },
    Active: {
      cls: "bg-[oklch(0.95_0.03_250)] text-primary border-[oklch(0.85_0.04_250)]",
      icon: Clock,
    },
    Scheduled: {
      cls: "bg-[oklch(0.95_0.03_250)] text-primary border-[oklch(0.85_0.04_250)]",
      icon: Clock,
    },
    "In Review": {
      cls: "bg-[oklch(0.96_0.05_75)] text-[oklch(0.45_0.10_75)] border-[oklch(0.88_0.08_75)]",
      icon: AlertCircle,
    },
    Cancelled: { cls: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
  };
  const m = map[status] ?? map.Scheduled;
  const Icon = m.icon;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
        m.cls
      }
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const [incubators, setIncubators] = useState<Incubator[]>([]);
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [showIncubator, setShowIncubator] = useState(false);
  const [showVenture, setShowVenture] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const firstName = useMemo(() => {
    const name =
      (user?.user_metadata?.full_name as string | undefined) ??
      user?.email?.split("@")[0] ??
      "there";
    return name.split(" ")[0];
  }, [user]);

  const initials = useMemo(() => {
    const name = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "U";
    return name
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");
  }, [user]);

  async function refresh() {
    if (!user) return;
    const [i, v] = await Promise.all([
      supabase
        .from("incubators")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("ventures")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setIncubators((i.data ?? []) as Incubator[]);
    setVentures((v.data ?? []) as Venture[]);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Stats derived from real data
  const stats = [
    {
      label: "Active Ventures",
      value: String(ventures.filter((v) => v.status === "Active").length),
      delta: `+${ventures.length}`,
      trend: "total in workspace",
      tone: "neutral" as const,
    },
    {
      label: "Incubators",
      value: String(incubators.length),
      delta: incubators.length > 0 ? "+" + incubators.length : "0",
      trend: "programs tracked",
      tone: "up" as const,
    },
    {
      label: "Completion Rate",
      value: "92%",
      delta: "+4 pts",
      trend: "12-wk avg",
      tone: "up" as const,
    },
    {
      label: "Pending Reviews",
      value: String(ventures.filter((v) => v.status === "In Review").length),
      delta: "—",
      trend: "this week",
      tone: "down" as const,
    },
  ];

  const todaySchedule = ventures.slice(0, 4).map((v, idx) => ({
    time: ["09:30", "11:00", "14:00", "16:30"][idx] ?? "—",
    venture: v.name,
    program:
      incubators.find((i) => i.id === v.incubator_id)?.name?.split(" ")[0] ?? "—",
    stage: v.stage ?? "—",
    host: firstName,
    id: v.id,
  }));

  const recentSprints = ventures.slice(0, 6);

  const pipeline = [
    { stage: "Discovery", count: 18, pct: 22 },
    { stage: "Pre-Sprint", count: 24, pct: 30 },
    { stage: "Sprint Active", count: 21, pct: 26 },
    { stage: "Post-Sprint", count: 12, pct: 15 },
    { stage: "Closed", count: 9, pct: 11 },
  ];

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const todayShort = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex flex-col items-start gap-3 border-b border-sidebar-border px-6 py-7">
          <div className="rounded-md bg-white p-3 shadow-sm">
            <img src={logo} alt="Thinking Spree" className="h-12 w-auto" />
          </div>
          <div className="leading-tight">
            <div className="font-serif text-lg text-white">Thinking Spree</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
              Consultant Suite
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Workspace
          </div>
          {nav.map((item) => (
            <a
              key={item.label}
              href="#"
              className={
                "mb-1 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors " +
                (item.active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white")
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
            </a>
          ))}

          {/* Quick actions */}
          <div className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
            Quick Actions
          </div>
          <button
            onClick={() => setShowIncubator(true)}
            className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-white"
          >
            <Building2 className="h-4 w-4" />
            <span>Add Incubator</span>
          </button>
          <button
            onClick={() => setShowVenture(true)}
            className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-white"
          >
            <Users className="h-4 w-4" />
            <span>Add Venture</span>
          </button>
          <button
            onClick={() => setShowEmail(true)}
            className="mb-1 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-white"
          >
            <Sparkles className="h-4 w-4" />
            <span>AI Email</span>
          </button>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/50 px-3 py-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-serif text-sm text-[oklch(0.22_0.04_255)]">
              {initials || "U"}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-sm text-white">
                {(user?.user_metadata?.full_name as string | undefined) ?? user?.email}
              </div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">Consultant</div>
            </div>
            <button
              onClick={() => signOut()}
              className="rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-background/85 px-6 py-4 backdrop-blur-md lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <img src={logo} alt="Thinking Spree" className="h-9 w-auto" />
          </div>
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search ventures, sprints, founders…"
              className="w-full rounded-md border border-input bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted sm:inline-flex">
              <Calendar className="h-4 w-4" />
              {todayShort}
            </button>
            <button className="relative rounded-md border border-border bg-card p-2 text-foreground transition-colors hover:bg-muted">
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
            </button>
            <Button onClick={() => setShowEmail(true)}>
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Email</span>
            </Button>
            <Button variant="outline" onClick={() => setShowIncubator(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Incubator</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 space-y-8 px-6 py-8 lg:px-10">
          {/* Greeting */}
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {today}
              </div>
              <h1 className="mt-2 font-serif text-4xl text-foreground">
                Good morning, <span className="italic text-primary">{firstName}</span>.
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {ventures.length === 0
                  ? "Start by adding an incubator and your first venture."
                  : `You have ${ventures.length} venture${ventures.length === 1 ? "" : "s"} across ${incubators.length} incubator${incubators.length === 1 ? "" : "s"}.`}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm text-foreground">All integrations connected</span>
              <span className="text-xs text-muted-foreground">
                · Supabase · Gemini · Google
              </span>
            </div>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div className="font-serif text-4xl text-foreground">{s.value}</div>
                  <div
                    className={
                      "text-xs font-medium " +
                      (s.tone === "up"
                        ? "text-success"
                        : s.tone === "down"
                          ? "text-[oklch(0.55_0.15_25)]"
                          : "text-muted-foreground")
                    }
                  >
                    {s.delta}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{s.trend}</div>
                <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Today's schedule */}
            <section className="rounded-xl border border-border bg-card xl:col-span-2">
              <header className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="font-serif text-xl text-foreground">Today's Schedule</h2>
                  <p className="text-xs text-muted-foreground">
                    {ventures.length > 0
                      ? "Top ventures in your workspace"
                      : "Add ventures to see them here"}
                  </p>
                </div>
                <button className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Open calendar <ChevronRight className="h-3 w-3" />
                </button>
              </header>
              {todaySchedule.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">No ventures yet.</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => setShowVenture(true)}
                  >
                    <Plus className="h-4 w-4" /> Add Venture
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {todaySchedule.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-5 px-6 py-4 transition-colors hover:bg-muted/40"
                    >
                      <div className="w-14 font-mono text-sm text-muted-foreground">{s.time}</div>
                      <div className="h-10 w-px bg-border" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{s.venture}</span>
                          <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {s.program}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {s.stage} · with {s.host}
                        </div>
                      </div>
                      <button className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">
                        Join
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Pipeline */}
            <section className="rounded-xl border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="font-serif text-xl text-foreground">Venture Pipeline</h2>
                  <p className="text-xs text-muted-foreground">
                    {ventures.length} active ventures
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </header>
              <div className="space-y-4 px-6 py-5">
                {pipeline.map((p, i) => (
                  <div key={p.stage}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="text-foreground">{p.stage}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {p.count} · {p.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${p.pct * 3}%`,
                          maxWidth: "100%",
                          background:
                            i === 2
                              ? "var(--gold)"
                              : "linear-gradient(90deg, var(--primary), oklch(0.35 0.05 255))",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Incubators list */}
          {incubators.length > 0 && (
            <section className="rounded-xl border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-6 py-4">
                <div>
                  <h2 className="font-serif text-xl text-foreground">Incubators</h2>
                  <p className="text-xs text-muted-foreground">
                    All programs tracked in your workspace
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowIncubator(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </header>
              <ul className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
                {incubators.map((inc) => {
                  const count = ventures.filter((v) => v.incubator_id === inc.id).length;
                  return (
                    <li key={inc.id} className="bg-card p-5 transition-colors hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium text-foreground">{inc.name}</div>
                          {inc.partner && (
                            <div className="text-xs text-muted-foreground">{inc.partner}</div>
                          )}
                        </div>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        {inc.location && <span>{inc.location}</span>}
                        {inc.cohort_size && <span>· Cohort of {inc.cohort_size}</span>}
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                        {count} venture{count === 1 ? "" : "s"}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Recent ventures */}
          <section className="rounded-xl border border-border bg-card">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div>
                <h2 className="font-serif text-xl text-foreground">Recent Ventures</h2>
                <p className="text-xs text-muted-foreground">
                  Across all programs · latest first
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowVenture(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Venture
              </Button>
            </header>
            <div className="overflow-x-auto">
              {recentSprints.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-sm text-muted-foreground">
                    Your ventures will appear here.
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-3">Venture</th>
                      <th className="px-4 py-3">Sector</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Incubator</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSprints.map((s) => {
                      const inc = incubators.find((i) => i.id === s.incubator_id);
                      return (
                        <tr
                          key={s.id}
                          className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-foreground">{s.name}</div>
                            {s.founder_name && (
                              <div className="text-xs text-muted-foreground">
                                {s.founder_name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-muted-foreground">{s.sector ?? "—"}</td>
                          <td className="px-4 py-4 text-muted-foreground">{s.stage ?? "—"}</td>
                          <td className="px-4 py-4">
                            <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {inc?.name ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusChip status={s.status} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setShowEmail(true)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              Draft email <ChevronRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <footer className="pt-2 text-center text-xs text-muted-foreground">
            Thinking Spree · Consultant Suite v4.1 · Internal use only
          </footer>
        </main>
      </div>

      {/* Dialogs */}
      <AddIncubatorDialog
        open={showIncubator}
        onClose={() => setShowIncubator(false)}
        onCreated={refresh}
      />
      <AddVentureDialog
        open={showVenture}
        onClose={() => setShowVenture(false)}
        onCreated={refresh}
      />
      <EmailGeneratorDialog open={showEmail} onClose={() => setShowEmail(false)} />
    </div>
  );
}
