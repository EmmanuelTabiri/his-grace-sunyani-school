import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, type ReactNode } from "react";
import {
  ArrowRight,
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
import { greetingFor, learningStageCount } from "@/lib/portal-overview";
import { type SectionId } from "@/lib/portal-nav";
import { useSchoolSettings } from "@/components/portal/SchoolSettings";
import { defaultSchoolSettings } from "@/lib/school-settings";

type Student = Database["public"]["Tables"]["students"]["Row"];
type Fee = Database["public"]["Tables"]["fees"]["Row"] & {
  students: { full_name: string; class_name: string } | null;
};
type Event = Database["public"]["Tables"]["events"]["Row"];

function Panel({ title, subtitle, action, children, bodyClass = "" }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; bodyClass?: string }) {
  return (
    <section className="portal-panel">
      <div className="portal-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={`portal-panel-body ${bodyClass}`}>{children}</div>
    </section>
  );
}

function SectionLink({ section, children }: { section: SectionId; children: ReactNode }) {
  return <Link to="/portal" search={{ s: section }} className="portal-text-link inline-flex items-center gap-1">{children}<ArrowRight className="h-3 w-3" /></Link>;
}

export function OverviewHeader({ firstName, roles }: { firstName: string; roles: Role[] }) {
  const now = new Date();
  const { data: settings = defaultSchoolSettings() } = useSchoolSettings();
  const leader = roles.includes("admin") || roles.includes("head_teacher");
  const teacher = roles.includes("teacher");
  const actions: { section: SectionId; label: string; primary?: boolean }[] = leader
    ? [{ section: "students", label: "Add student", primary: true }]
    : teacher
      ? [{ section: "marks", label: "Enter marks", primary: true }]
      : [{ section: "results", label: "View results", primary: true }];
  const subtitle = leader
    ? "Here’s a clear view of what’s happening across your school."
    : teacher
      ? "Your classes, deadlines and latest announcements in one place."
      : "Keep up with learning, homework, results and fee receipts.";

  return (
    <section className="portal-page-heading">
      <div>
        <p className="portal-overline">{settings.school_name} · {settings.academic_year} · {settings.current_term}</p>
        <h1>{greetingFor(now)}{firstName ? `, ${firstName}` : ""}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="portal-actions">
        {actions.map((action) => (
          <Link key={action.section} to="/portal" search={{ s: action.section }} className={action.primary ? "btn-primary" : "inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-muted"}>
            <Plus className="h-4 w-4" />{action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, note, icon: Icon, tone = "primary" }: { label: string; value: string | number; note: string; icon: LucideIcon; tone?: "primary" | "secondary" | "destructive" | "success" }) {
  const toneClass = tone === "secondary" ? "portal-stat-icon-secondary" : tone === "destructive" ? "portal-stat-icon-destructive" : tone === "success" ? "portal-stat-icon-success" : "";
  return (
    <div className="portal-stat">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <span className={`portal-stat-icon ${toneClass}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="portal-stat-value">{value}</p>
      <p className="portal-stat-note">{note}</p>
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
    <Panel title="Upcoming events" subtitle="Key dates for the school" bodyClass="portal-events">
      {isLoading ? <p className="text-sm text-muted-foreground">Loading events…</p> : next.length === 0 ? (
        <div className="py-8 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No upcoming events.</p></div>
      ) : (
        <ul className="divide-y">
          {next.map((event) => {
            const date = new Date(`${event.event_date}T00:00:00`);
            const day = date.getDate();
            return (
              <li key={event.id} className="portal-event">
                <span className="portal-event-date"><b>{String(day).padStart(2, "0")}</b><small>{new Intl.DateTimeFormat("en", { month: "short" }).format(date)}</small></span>
                <span className="min-w-0"><b>{event.title}</b><small>{event.place || "School event"}{event.description ? ` · ${event.description}` : ""}</small></span>
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
    return rows.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 4);
  }, [admin, data, fees, students]);

  return (
    <Panel title="Recent activity" subtitle="Latest updates from across the school" action={<SectionLink section="announcements">View activity</SectionLink>} bodyClass="portal-activity">
      {activities.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Activity appears here as the school uses the portal.</p> : (
        <ul className="divide-y">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <li key={activity.id} className="portal-activity-row">
                <span className="portal-activity-icon"><Icon className="h-3.5 w-3.5" /></span>
                <div className="portal-activity-copy">
                  <p><b>{activity.title}</b><span> — {activity.detail}</span></p>
                  <small>{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(activity.time))} · {activity.category}</small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function LeaderOverview({ roles }: { roles: Role[] }) {
  const admin = roles.includes("admin");
  const { data: students = [] } = useQuery({ queryKey: ["students"], queryFn: async () => ((await supabase.from("students").select("*").order("full_name")).data ?? []) as Student[] });
  const { data: access = [] } = useQuery({ queryKey: ["overview-access"], queryFn: async () => (await supabase.from("user_roles").select("user_id, role")).data ?? [] });
  const { data: fees = [] } = useQuery({ queryKey: ["fees"], enabled: admin, queryFn: async () => ((await supabase.from("fees").select("*, students(full_name, class_name)").order("created_at", { ascending: false })).data ?? []) as Fee[] });
  const active = students.filter((student) => student.active).length;
  const classes = [...new Set(students.map((student) => student.class_name))].sort();
  const teachers = new Set(access.filter((row) => row.role === "teacher").map((row) => row.user_id)).size;
  const users = new Set(access.map((row) => row.user_id)).size;
  const collected = fees.reduce((sum, fee) => sum + Number(fee.paid_amount), 0);
  const outstanding = fees.reduce((sum, fee) => sum + Number(fee.amount) - Number(fee.paid_amount), 0);

  return (
    <>
      <div className="portal-grid-stats">
        <MetricCard label="Total students" value={students.length} note={`${active} active student records`} icon={GraduationCap} />
        <MetricCard label="Active teachers" value={teachers} note="Accounts with teacher access" icon={Users} tone="success" />
        <MetricCard label="Classes" value={classes.length} note={classes.length ? `Across ${learningStageCount(classes)} learning stages` : "Classes appear as students are added"} icon={School} tone="secondary" />
        {admin
          ? <MetricCard label="Fees outstanding" value={cedi(outstanding)} note={`Collected: ${cedi(collected)}`} icon={WalletCards} tone={outstanding > 0 ? "destructive" : "primary"} />
          : <MetricCard label="Portal users" value={users} note="Staff, student and parent accounts" icon={UserCog} />}
      </div>
      <div className="portal-grid-main">
        <RecentActivity students={students} fees={fees} admin={admin} />
        <EventsPanel />
      </div>
      <div className="portal-notice"><b>Next up:</b> Review draft marks before publishing results to students and parents. <SectionLink section="gradebook">Open gradebook</SectionLink></div>
    </>
  );
}
