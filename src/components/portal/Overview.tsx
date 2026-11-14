import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  Plus,
  Receipt,
  School,
  UserCog,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cedi } from "@/lib/money";
import type { Role } from "@/lib/portal-access";
import { feeCollectionByMonth, greetingFor, learningStageCount } from "@/lib/portal-overview";
import { schoolYear, type SectionId } from "@/lib/portal-nav";

type Student = Database["public"]["Tables"]["students"]["Row"];
type Fee = Database["public"]["Tables"]["fees"]["Row"] & {
  students: { full_name: string; class_name: string } | null;
};
type Event = Database["public"]["Tables"]["events"]["Row"];

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="portal-panel">
      <div className="portal-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="portal-panel-body">{children}</div>
    </section>
  );
}

function SectionLink({ section, children }: { section: SectionId; children: ReactNode }) {
  return <Link to="/portal" search={{ s: section }} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">{children}<ArrowRight className="h-4 w-4" /></Link>;
}

export function OverviewHeader({ firstName, roles }: { firstName: string; roles: Role[] }) {
  const now = new Date();
  const leader = roles.includes("admin") || roles.includes("head_teacher");
  const teacher = roles.includes("teacher");
  const actions: { section: SectionId; label: string; primary?: boolean }[] = leader
    ? [{ section: "students", label: "Add student", primary: true }, { section: "staff", label: "Add staff member" }, { section: "classes", label: "Create class" }]
    : teacher
      ? [{ section: "marks", label: "Enter marks", primary: true }, { section: "homework", label: "Create homework" }, { section: "announcements", label: "Post announcement" }]
      : [{ section: "results", label: "View results", primary: true }, { section: "homework", label: "View homework" }, { section: "fees", label: "Fees & receipts" }];
  const subtitle = leader
    ? "Here’s what’s happening across the school."
    : teacher
      ? "Your classes, deadlines and latest announcements in one place."
      : "Keep up with learning, homework, results and fee receipts.";

  return (
    <section className="portal-page-heading">
      <div>
        <p className="portal-overline">His Grace Academy · {schoolYear()}</p>
        <h1>{greetingFor(now)}{firstName ? `, ${firstName}` : ""}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link key={action.section} to="/portal" search={{ s: action.section }} className={action.primary ? "btn-primary" : "inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-muted"}>
            <Plus className="h-4 w-4" />{action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone = "primary" }: { label: string; value: string | number; note: string; icon: LucideIcon; tone?: "primary" | "secondary" | "destructive" }) {
  const toneClass = tone === "secondary" ? "portal-stat-icon-secondary" : tone === "destructive" ? "portal-stat-icon-destructive" : "";
  return (
    <div className="portal-stat">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span className={`portal-stat-icon ${toneClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="portal-stat-value mt-2">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{note}</p>
    </div>
  );
}

function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: async () => ((await supabase.from("events").select("*").order("event_date")).data ?? []) as Event[],
  });
}

export function EventsPanel() {
  const { data: events = [], isLoading } = useEvents();
  const today = new Date().toISOString().slice(0, 10);
  const next = events.filter((event) => event.event_date >= today).slice(0, 3);
  return (
    <Panel title="Upcoming events" subtitle="What’s coming up" action={<SectionLink section="announcements">View all</SectionLink>}>
      {isLoading ? <p className="text-sm text-muted-foreground">Loading events…</p> : next.length === 0 ? (
        <div className="py-8 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No upcoming events.</p></div>
      ) : (
        <ul className="divide-y">
          {next.map((event) => {
            const date = new Date(`${event.event_date}T00:00:00`);
            const day = date.getDate();
            return (
              <li key={event.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-secondary/25 leading-none text-secondary-foreground">
                  <span><b className="block text-xl">{String(day).padStart(2, "0")}</b><span className="mt-1 block text-[10px] font-extrabold uppercase">{new Intl.DateTimeFormat("en", { month: "short" }).format(date)}</span></span>
                </span>
                <span className="min-w-0"><b className="block text-sm">{event.title}</b><span className="mt-1 block text-xs text-muted-foreground">{event.place || "School event"}{event.description ? ` · ${event.description}` : ""}</span></span>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

type Activity = { id: string; time: string; title: string; detail: string; category: string; icon: LucideIcon };

function RecentActivity({ students, fees, admin }: { students: Student[]; fees: Fee[]; admin: boolean }) {
  const { data } = useQuery({
    queryKey: ["leader-overview-activity"],
    queryFn: async () => {
      const [marks, homework, announcements] = await Promise.all([
        supabase.from("marks").select("id, subject, assessment, published, created_at, students(full_name, class_name)").order("created_at", { ascending: false }).limit(12),
        supabase.from("homework").select("id, title, subject, class_name, created_at").order("created_at", { ascending: false }).limit(12),
        supabase.from("announcements").select("id, title, class_name, created_at").order("created_at", { ascending: false }).limit(12),
      ]);
      return { marks: marks.data ?? [], homework: homework.data ?? [], announcements: announcements.data ?? [] };
    },
  });
  const activities = useMemo<Activity[]>(() => {
    const rows: Activity[] = [
      ...students.map((student) => ({ id: `student-${student.id}`, time: student.created_at, title: "Student added", detail: `${student.full_name} · ${student.class_name}`, category: "Admissions", icon: GraduationCap })),
      ...(data?.marks ?? []).map((mark) => ({ id: `mark-${mark.id}`, time: mark.created_at, title: `${mark.subject} mark ${mark.published ? "published" : "saved as draft"}`, detail: `${mark.assessment} · ${mark.students?.full_name ?? "Student"} · ${mark.students?.class_name ?? ""}`, category: "Academics", icon: ClipboardCheck })),
      ...(data?.homework ?? []).map((item) => ({ id: `homework-${item.id}`, time: item.created_at, title: "Homework assigned", detail: `${item.title} · ${item.subject} · ${item.class_name}`, category: "Classwork", icon: BookOpen })),
      ...(data?.announcements ?? []).map((item) => ({ id: `announcement-${item.id}`, time: item.created_at, title: "Announcement posted", detail: `${item.title} · ${item.class_name ?? "Whole school"}`, category: "Announcements", icon: Megaphone })),
    ];
    if (admin) rows.push(...fees.filter((fee) => fee.status === "paid").map((fee) => ({ id: `fee-${fee.id}`, time: fee.paid_on ?? fee.created_at, title: `Fee payment recorded · ${cedi(fee.amount)}`, detail: `${fee.students?.full_name ?? "Student"}${fee.payment_method ? ` · ${fee.payment_method}` : ""}`, category: "Fees", icon: Receipt })));
    return rows.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
  }, [admin, data, fees, students]);

  return (
    <Panel title="Recent activity" subtitle="Latest updates across the school">
      {activities.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Activity appears here as the school uses the portal.</p> : (
        <ul className="divide-y">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <li key={activity.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary"><Icon className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><b>{activity.title}</b><span className="text-muted-foreground"> — {activity.detail}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(activity.time))} · {activity.category}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function RecentlyAddedStudents({ students }: { students: Student[] }) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const classes = [...new Set(students.map((student) => student.class_name))].sort();
  const rows = [...students]
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || a.full_name.localeCompare(b.full_name))
    .filter((student) => student.full_name.toLowerCase().includes(query.toLowerCase()) && (!classFilter || student.class_name === classFilter))
    .slice(0, 5);
  return (
    <Panel title="Recently added students" subtitle="Newest student records" action={<SectionLink section="students">All students</SectionLink>}>
      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students…" aria-label="Search recently added students" className="w-full rounded-xl border bg-background px-3 py-2 text-sm" />
        <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} aria-label="Filter recent students by class" className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="">All classes</option>{classes.map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No students match these filters.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3">Student</th><th>Class</th><th>Enrolled</th><th>Status</th></tr></thead>
            <tbody>{rows.map((student) => {
              const initials = student.full_name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
              return (
                <tr key={student.id} className="border-t">
                  <td className="py-3 pr-3"><span className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary/25 text-xs font-extrabold text-secondary-foreground">{initials}</span><b>{student.full_name}</b></span></td>
                  <td>{student.class_name}</td>
                  <td className="whitespace-nowrap text-muted-foreground">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(student.created_at))}</td>
                  <td><span className={`portal-badge ${student.active ? "portal-badge-green" : "portal-badge-gray"}`}>{student.active ? "Active" : "Inactive"}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function FeeCollection({ fees }: { fees: Fee[] }) {
  const months = feeCollectionByMonth(fees);
  const max = Math.max(1, ...months.flatMap((month) => [month.collected, month.outstanding]));
  const billed = fees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  return (
    <Panel title="Fee collection" subtitle="Collected vs outstanding · last 6 months">
      <p className="text-sm"><b>{cedi(billed)}</b> <span className="text-muted-foreground">billed across all fee records</span></p>
      <div className="mt-6 grid h-56 grid-cols-6 gap-2" role="img" aria-label="Monthly collected and outstanding fee bar chart">
        {months.map((month) => (
          <div key={month.key} className="flex min-w-0 flex-col" title={`${month.label}: ${cedi(month.collected)} collected, ${cedi(month.outstanding)} outstanding`}>
            <div className="flex flex-1 items-end justify-center gap-1">
              <span className="w-3 rounded-t-md bg-primary sm:w-4" style={{ height: `${month.collected ? Math.max(3, month.collected / max * 100) : 0}%` }} />
              <span className="w-3 rounded-t-md bg-secondary sm:w-4" style={{ height: `${month.outstanding ? Math.max(3, month.outstanding / max * 100) : 0}%` }} />
            </div>
            <span className="mt-2 text-center text-xs text-muted-foreground">{month.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-primary" />Collected</span><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-secondary" />Outstanding</span></div>
    </Panel>
  );
}

export function LeaderOverview({ roles }: { roles: Role[] }) {
  const admin = roles.includes("admin");
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: async () => ((await supabase.from("students").select("*").order("full_name")).data ?? []) as Student[] });
  const { data: access = [] } = useQuery({ queryKey: ["overview-access"], queryFn: async () => (await supabase.from("user_roles").select("user_id, role")).data ?? [] });
  const { data: fees = [] } = useQuery({ queryKey: ["fees"], enabled: admin, queryFn: async () => ((await supabase.from("fees").select("*, students(full_name, class_name)").order("created_at", { ascending: false })).data ?? []) as Fee[] });
  const { data: events = [] } = useEvents();
  const active = students.filter((student) => student.active).length;
  const classes = [...new Set(students.map((student) => student.class_name))].sort();
  const teachers = new Set(access.filter((row) => row.role === "teacher").map((row) => row.user_id)).size;
  const users = new Set(access.map((row) => row.user_id)).size;
  const collected = fees.filter((fee) => fee.status === "paid").reduce((sum, fee) => sum + Number(fee.amount), 0);
  const outstanding = fees.filter((fee) => fee.status === "unpaid").reduce((sum, fee) => sum + Number(fee.amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const nextEvent = events.find((event) => event.event_date >= today);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <MetricCard label="Active students" value={active} note={`${students.length} student records in total`} icon={GraduationCap} />
        <MetricCard label="Teachers" value={teachers} note="Accounts with teacher access" icon={Users} />
        <MetricCard label="Classes" value={classes.length} note={classes.length ? `Across ${learningStageCount(classes)} learning stages` : "Classes appear as students are added"} icon={School} tone="secondary" />
        {admin
          ? <MetricCard label="Outstanding fees" value={cedi(outstanding)} note={`Collected: ${cedi(collected)}`} icon={WalletCards} tone={outstanding > 0 ? "destructive" : "primary"} />
          : <MetricCard label="Portal users" value={users} note="Staff, student and parent accounts" icon={UserCog} />}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <RecentActivity students={students} fees={fees} admin={admin} />
        <EventsPanel />
      </div>
      <div className={`grid gap-6 ${admin ? "xl:grid-cols-[1.6fr_1fr]" : ""}`}>
        <RecentlyAddedStudents students={students} />
        {admin && <FeeCollection fees={fees} />}
      </div>
      {nextEvent && (
        <div className="flex flex-col gap-3 rounded-2xl border border-secondary/50 bg-accent p-5 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/25 text-secondary-foreground"><BellRing className="h-5 w-5" /></span>
          <p className="flex-1 text-sm"><b>Coming up: {nextEvent.title}</b><span className="mt-1 block text-muted-foreground">{nextEvent.event_date}{nextEvent.place ? ` · ${nextEvent.place}` : ""}{nextEvent.description ? ` · ${nextEvent.description}` : ""}</span></p>
          <SectionLink section="announcements">View events</SectionLink>
        </div>
      )}
    </>
  );
}
