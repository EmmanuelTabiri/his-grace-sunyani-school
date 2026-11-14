import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import logo from "@/assets/school-logo.png.asset.json";
import { Bell, BookOpen, ChevronLeft, ChevronRight, ClipboardList, FileText, GraduationCap, LayoutDashboard, Megaphone, Menu, NotebookPen, Plus, Receipt, School, Settings, Table2, UserCog, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cedi } from "@/lib/money";
import { downloadPdfReport } from "@/lib/report-pdf";
import { StaffTools, FamilyLearning, MyClasses, Gradebook, DraftCount } from "@/components/portal/Classroom";
import { EventsPanel, LeaderOverview, OverviewHeader } from "@/components/portal/Overview";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { meta } from "@/components/SiteLayout";
import { ROLES, roleLabel, canChangeRole, type Role } from "@/lib/portal-access";
import { portalSections, type SectionId } from "@/lib/portal-nav";
import { SchoolSettings, useSchoolSettings } from "@/components/portal/SchoolSettings";
import { defaultSchoolSettings } from "@/lib/school-settings";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => { const tags = meta("School Portal", "Manage students, teachers, learning and school fees at His Grace Academy."); return { ...tags, meta: [...tags.meta, { name: "robots", content: "noindex" }] }; },
  validateSearch: (s: Record<string, unknown>): { s?: string } => (typeof s["s"] === "string" ? { s: s["s"] as string } : {}),
  component: Portal,
});

const field = "w-full rounded-lg border bg-background px-3 py-2";
const ICONS: Record<SectionId, LucideIcon> = { overview: LayoutDashboard, students: GraduationCap, staff: UserCog, classes: School, gradebook: Table2, marks: ClipboardList, results: ClipboardList, homework: BookOpen, announcements: Megaphone, diary: NotebookPen, fees: Receipt, reports: FileText, settings: Settings };
const PAGE_DESCRIPTIONS: Record<SectionId, string> = {
  overview: "Here’s a clear view of what’s happening across your school.",
  students: "Manage student records, class placement and family links.",
  staff: "Manage portal access for staff, students and parents.",
  classes: "Set up class groups and assign teachers to subjects.",
  gradebook: "Review class assessments, drafts and published results.",
  marks: "Enter assessment scores and choose whether to publish them.",
  results: "View published marks, scores and teacher feedback.",
  homework: "Create and publish homework with clear class and due-date details.",
  announcements: "Share important updates and event details with the school community.",
  diary: "Share a concise daily summary of topics studied with students and families.",
  fees: "Track student charges, payment status and receipt references.",
  reports: "Download titled, date-stamped PDF reports for school records.",
  settings: "Manage the details used across the school portal.",
};

function PageIntro({ section, family, title, action }: { section: SectionId; family: boolean; title: string; action?: ReactNode }) {
  const { data: settings = defaultSchoolSettings() } = useSchoolSettings();
  const description = family && section === "homework"
    ? "View instructions, attachments and upcoming due dates."
    : family && section === "announcements"
      ? "Read school updates and upcoming event details."
      : family && section === "fees"
        ? "View your fee balance, payment history and official receipts."
        : PAGE_DESCRIPTIONS[section];
  return <section className="portal-page-heading"><div><p className="portal-overline">{settings.school_name} · {settings.academic_year} · {settings.current_term}</p><h1>{section === "marks" ? "Record marks" : title}</h1><p>{description}</p></div>{action && <div className="portal-actions">{action}</div>}</section>;
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter((part) => part && !part.startsWith("("));
  return parts.length ? `${parts[0]?.[0] ?? ""}${parts.at(-1)?.[0] ?? ""}`.toUpperCase() : "?";
}

function portalRole(roles: Role[]) {
  if (roles.includes("admin")) return "Administrator";
  return roles.map(roleLabel).join(", ") || "Awaiting access";
}

function Portal() {
  const { user } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user.id)).data?.map((r) => r.role) ?? [],
  });
  const { data: me } = useQuery({ queryKey: ["me", user.id], queryFn: async () => (await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()).data });
  const isLeader = roles.includes("admin") || roles.includes("head_teacher");
  const isTeacher = roles.includes("teacher");
  const isStaff = isLeader || isTeacher;
  const isFamily = !isStaff && (roles.includes("student") || roles.includes("parent"));
  const { data: schoolSettings = defaultSchoolSettings() } = useSchoolSettings(roles.length > 0);
  const sections = portalSections(roles);
  const current = (sections.find((x) => x.id === search.s) ?? sections[0]);
  const s = current?.id ?? "overview";
  const { data: kids = [] } = useQuery({ queryKey: ["students"], enabled: isFamily, queryFn: async () => (await supabase.from("students").select("*").order("full_name")).data ?? [] });
  const [kidId, setKidId] = useState<string | null>(null);
  const kid = kids.find((k) => k.id === kidId) ?? kids[0] ?? null;
  const { data: recent = [] } = useQuery({ queryKey: ["announcements"], enabled: roles.length > 0, queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const fresh = recent.filter((n) => Date.now() - Date.parse(n.created_at) < 7 * 86_400_000);
  const firstName = (me?.full_name || user.email || "").split(/[ @]/)[0] ?? "";

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const referenceOrder: SectionId[] = ["overview", "students", "staff", "classes", "marks", "gradebook", "homework", "diary", "fees", "announcements", "results", "reports", "settings"];
  const orderedSections = [...sections].sort((a, b) => referenceOrder.indexOf(a.id) - referenceOrder.indexOf(b.id));
  const nav = (
    <nav aria-label="Portal sections" className="portal-nav flex-1 overflow-y-auto">
      <p className="portal-nav-title">Portal</p>
      {orderedSections.map((x) => {
        const Icon = ICONS[x.id];
        const active = x.id === s;
        return (
          <Link key={x.id} to="/portal" search={{ s: x.id }} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={`portal-nav-link ${active ? "portal-nav-active" : ""}`}>
            <Icon className="h-4 w-4 shrink-0" />{x.label}
          </Link>
        );
      })}
    </nav>
  );
  const brand = (
    <Link to="/" className="flex items-center gap-2.5">
      <img src={logo.url} alt="His Grace Academy logo" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg bg-card object-contain" />
      <span className="min-w-0 leading-tight"><span className="portal-brand block truncate">{schoolSettings.school_name}</span><span className="portal-brand-subtitle mt-1 block">School management</span></span>
    </Link>
  );
  const schoolChip = <div className="portal-school-chip"><span className="portal-school-mark"><School className="h-4 w-4" /></span><span className="min-w-0"><b className="block truncate text-[11px] text-primary">{schoolSettings.school_name}</b><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{isLeader ? "Administration workspace" : isTeacher ? "Teacher workspace" : "Family workspace"}</span></span></div>;
  const account = <div className="flex items-center gap-2.5"><span className="portal-avatar">{initialsFor(me?.full_name || firstName)}</span><span className="min-w-0"><b className="block truncate text-[11px] text-primary">{me?.full_name || "My account"}</b><span className="block truncate text-[10px] text-muted-foreground">{portalRole(roles)}</span></span></div>;

  return (
    <div className="portal-app flex min-h-screen w-full">
      {roles.length > 0 && <aside className="portal-sidebar sticky top-0 hidden h-screen w-[246px] shrink-0 flex-col gap-4 border-r p-4 min-[721px]:flex">
        <div className="border-b px-1 pb-4 pt-1">{brand}</div>{schoolChip}{nav}
        <div className="border-t px-1 pt-4">{account}</div>
      </aside>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="portal-topbar sticky top-0 z-20 border-b">
          <div className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              {roles.length > 0 && <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild><button className="rounded-lg border p-2 min-[721px]:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button></SheetTrigger>
                <SheetContent side="left" className="portal-app portal-sidebar w-72 border-r p-4"><SheetTitle className="sr-only">Portal menu</SheetTitle><div className="flex h-full flex-col gap-4"><div className="border-b px-1 pb-4 pt-1">{brand}</div>{schoolChip}{nav}<div className="border-t px-1 pt-4">{account}</div></div></SheetContent>
              </Sheet>}
              <div className="min-w-0"><p className="truncate text-[11px] text-muted-foreground"><span>Portal</span><span className="mx-2">›</span><strong className="font-bold text-foreground">{current?.label ?? "Overview"}</strong></p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-lg border bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground min-[721px]:block">{schoolSettings.academic_year.replace("/", " / ")} · {schoolSettings.current_term}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="relative rounded-lg border p-2" aria-label={`Notifications, ${fresh.length} new`}><Bell className="h-4 w-4" />{fresh.length > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-secondary px-1 text-[10px] font-bold text-secondary-foreground">{fresh.length}</span>}</button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>New this week</DropdownMenuLabel><DropdownMenuSeparator />
                  {fresh.length === 0 ? <p className="p-3 text-sm text-muted-foreground">You're all caught up.</p> : fresh.slice(0, 5).map((n) => (
                    <DropdownMenuItem key={n.id} asChild><Link to="/portal" search={{ s: "announcements" }} className="flex flex-col items-start"><span className="font-semibold">{n.title}</span><span className="text-xs text-muted-foreground">{n.class_name ?? "Whole school"} · {n.created_at.slice(0, 10)}</span></Link></DropdownMenuItem>))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><button className="flex items-center gap-2 rounded-full p-1 text-left transition-colors hover:bg-muted" aria-label="Profile menu">
                  <span className="hidden min-w-0 min-[721px]:block"><b className="block max-w-40 truncate text-[11px]">{me?.full_name || "My account"}</b><span className="block text-[10px] text-muted-foreground">{portalRole(roles)}</span></span>
                  <span className="portal-avatar">{initialsFor(me?.full_name || firstName)}</span>
                </button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal"><span className="block font-semibold">{me?.full_name || "My account"}</span><span className="text-xs text-muted-foreground">{user.email}</span></DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/">School website</Link></DropdownMenuItem>
                  <DropdownMenuItem onSelect={signOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] space-y-4 px-4 py-5 min-[721px]:px-[30px] min-[721px]:py-[27px]">
          {isLoading ? <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />)}</div> : roles.length === 0 ? (
            <Card title="Awaiting access"><p className="text-muted-foreground">Your account is registered. The school office will assign your access (teacher, student or parent) shortly.</p></Card>
          ) : (
            <>
              {s === "overview" ? <OverviewHeader firstName={firstName} roles={roles} /> : !isLeader && <PageIntro section={s} family={isFamily} title={current?.label ?? "Portal"} />}
              {isLeader && s === "overview" && <LeaderOverview roles={roles} />}
              {isLeader && <AdminArea roles={roles} userId={user.id} show={s} />}
              {isTeacher && (s === "overview" || s === "classes") && <>
                {s === "overview" && <div className="grid gap-4 sm:max-w-sm">
                  <Link to="/portal" search={{ s: "gradebook" }} className="portal-stat block transition-colors hover:border-primary"><p className="text-xs text-muted-foreground">Marks still in draft</p><p className="portal-stat-value mt-1"><DraftCount userId={user.id} /></p><p className="mt-1 text-[11px] text-muted-foreground">Open the gradebook to review and publish</p></Link>
                </div>}
                <MyClasses userId={user.id} show={s} />
              </>}
              {isStaff && s === "gradebook" && <Gradebook userId={user.id} />}
              {isStaff && !(isLeader && s === "announcements") && <StaffTools userId={user.id} show={s} />}
              {isFamily && <>
                {kids.length > 1 && <div role="tablist" aria-label="Choose child" className="flex flex-wrap gap-2">{kids.map((k) => (
                  <button key={k.id} role="tab" aria-selected={kid?.id === k.id} onClick={() => setKidId(k.id)} className={`rounded-full border px-4 py-2 text-sm font-bold ${kid?.id === k.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{k.full_name}</button>))}</div>}
                {s === "overview" && <section className="portal-panel p-5">
                  <p className="text-sm text-muted-foreground">Student overview</p>
                  <h2 className="mt-1 text-2xl font-extrabold">{kid ? kid.full_name : "No student linked yet"}</h2>
                  <p className="mt-1 text-primary">{kid ? `${kid.class_name} · School year ${schoolSettings.academic_year} · ${schoolSettings.current_term}` : "The school office will link your account to a student."}</p>
                </section>}
                {kids.length === 0 && s !== "overview" ? <Card title="No student linked"><p className="text-muted-foreground">Once the school links your account to a student, their records appear here.</p></Card> : <>
                  {(s === "overview" || s === "fees") && <FamilyArea studentId={kid?.id ?? null} compact={s === "overview"} />}
                  <FamilyLearning show={s} student={kid ? { id: kid.id, class_name: kid.class_name } : null} />
                  {(s === "announcements" || s === "overview") && <UpcomingEvents />}
                </>}
              </>}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function UpcomingEvents() {
  return <EventsPanel />;
}


function Card({ title, subtitle, children, action, bodyClass = "" }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode; bodyClass?: string }) {
  return (
    <section className="portal-panel">
      <div className="portal-panel-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>
      <div className={`portal-panel-body ${bodyClass}`}>{children}</div>
    </section>
  );
}

function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const [p, r] = await Promise.all([supabase.from("profiles").select("*").order("created_at"), supabase.from("user_roles").select("user_id, role")]);
      return (p.data ?? []).map((x) => ({ ...x, roles: (r.data ?? []).filter((y) => y.user_id === x.id).map((y) => y.role) }));
    },
  });
}
function useStudents() {
  return useQuery({ queryKey: ["students"], queryFn: async () => (await supabase.from("students").select("*").order("full_name")).data ?? [] });
}
function useFees(enabled = true) {
  return useQuery({ queryKey: ["fees"], enabled, queryFn: async () => (await supabase.from("fees").select("*, students(full_name, class_name)").order("created_at", { ascending: false })).data ?? [] });
}

function AdminArea({ roles, userId, show }: { roles: Role[]; userId: string; show: string }) {
  const isAdmin = roles.includes("admin");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [studentOpen, setStudentOpen] = useState(false);
  const [feeOpen, setFeeOpen] = useState(false);
  const [accessUserId, setAccessUserId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const { data: students = [] } = useStudents();
  const { data: fees = [] } = useFees(isAdmin);
  const editing = students.find((s) => s.id === editingId);
  const accessProfile = profiles.find((p) => p.id === accessUserId);
  const refresh = () => qc.invalidateQueries();

  async function toggleRole(targetUserId: string, role: Role, has: boolean) {
    const target = profiles.find((p) => p.id === targetUserId);
    if (!target || !canChangeRole(roles, target.roles, role, targetUserId === userId)) return;
    if (has && !confirm(`Remove ${role} access?`)) return;
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: targetUserId, role });
    if (error) toast.error(error.message); else { toast.success("Access updated"); refresh(); }
  }

  async function renameUser(id: string, name: string) {
    if (!name.trim()) return;
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Name updated"); refresh(); }
  }

  async function addStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const values = {
      full_name: String(f.get("name")), class_name: String(f.get("class")), active: f.get("active") === "on",
      student_user_id: (f.get("student_user") as string) || null, guardian_user_id: (f.get("guardian") as string) || null,
    };
    const { error } = editingId
      ? await supabase.from("students").update(values).eq("id", editingId)
      : await supabase.from("students").insert(values);
    if (error) toast.error(error.message);
    else { toast.success(editingId ? "Student updated" : "Student added"); setStudentOpen(false); setEditingId(null); refresh(); }
  }

  async function addFee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = Number(f.get("amount"));
    if (!(amount > 0)) { toast.error("Enter an amount greater than 0"); return; }
    const paid = f.get("status") === "paid";
    const { error } = await supabase.from("fees").insert({
      student_id: String(f.get("student")), description: String(f.get("description")), amount,
      status: paid ? "paid" : "unpaid", payment_method: paid ? String(f.get("method")) : null,
    });
    if (error) toast.error(error.message);
    else { toast.success(paid ? "Payment recorded — receipt created" : "Fee added"); setFeeOpen(false); refresh(); }
  }

  async function markPaid(id: string) {
    const method = prompt("Payment method (Cash, Mobile Money, Bank transfer):", "Mobile Money");
    if (!method) return;
    const { error } = await supabase.from("fees").update({ status: "paid", payment_method: method }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Payment recorded — receipt created"); refresh(); }
  }

  const userName = (id: string | null) => profiles.find((p) => p.id === id)?.full_name || profiles.find((p) => p.id === id)?.email || "—";
  const classes = [...new Set(students.map((s) => s.class_name).filter(Boolean))].sort();
  const [q, setQ] = useState(""); const [cf, setCf] = useState(""); const [sf, setSf] = useState("all"); const [page, setPage] = useState(0);
  const filtered = students.filter((s) => s.full_name.toLowerCase().includes(q.toLowerCase()) && (!cf || s.class_name === cf) && (sf === "all" || (sf === "active") === s.active));
  const PER = 8; const pages = Math.max(1, Math.ceil(filtered.length / PER)); const shown = filtered.slice(page * PER, page * PER + PER);
  const [uq, setUq] = useState("");
  const [feeQuery, setFeeQuery] = useState(""); const [feeStatus, setFeeStatus] = useState("all");
  const visibleFees = fees.filter((fee) => (feeStatus === "all" || fee.status === feeStatus) && `${fee.students?.full_name ?? ""} ${fee.receipt_no ?? ""} ${fee.description}`.toLowerCase().includes(feeQuery.toLowerCase()));
  const people = profiles.filter((p) => (isAdmin || p.roles.some((r) => r === "teacher") || p.roles.length === 0) && `${p.full_name} ${p.email}`.toLowerCase().includes(uq.toLowerCase()));
  const collected = fees.filter((fee) => fee.status === "paid").reduce((sum, fee) => sum + Number(fee.amount), 0);
  const outstanding = fees.filter((fee) => fee.status === "unpaid").reduce((sum, fee) => sum + Number(fee.amount), 0);
  const receiptsIssued = fees.filter((fee) => fee.status === "paid" && fee.receipt_no).length;
  const section = show as SectionId;
  const title = portalSections(roles).find((item) => item.id === section)?.label ?? "Portal";
  const pageAction = show === "students"
    ? <button className="btn-primary" onClick={() => { setEditingId(null); setStudentOpen(true); }}><Plus className="h-3.5 w-3.5" />Add student</button>
    : show === "fees" && isAdmin
      ? <><button className="portal-btn" onClick={() => setFeeOpen(true)}><Plus className="h-3.5 w-3.5" />Add fee</button><button className="btn-primary" onClick={() => { const unpaid = fees.find((fee) => fee.status === "unpaid"); if (unpaid) void markPaid(unpaid.id); else toast.info("No unpaid fees found."); }}>Record payment</button></>
      : undefined;

  return (
    <>
      {show !== "overview" && <PageIntro section={section} family={false} title={title} action={pageAction} />}

      {show === "staff" && <Card title={isAdmin ? "People & role access" : "Teachers & access"} subtitle="Accounts must be created on the portal sign-in page before assigning access." bodyClass="!p-0">
        <div className="portal-toolbar"><input value={uq} onChange={(e) => setUq(e.target.value)} placeholder="Search by name or email…" className={`${field} portal-search`} aria-label="Search people" /></div>
        <div className="portal-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Account status</th><th>Actions</th></tr></thead>
          <tbody>{people.map((p) => <tr key={p.id}>
            <td><div className="portal-person"><span className="portal-person-avatar">{initialsFor(p.full_name || p.email)}</span><b>{p.full_name || "—"}</b></div></td><td>{p.email}</td>
            <td><span className="flex flex-wrap gap-1">{p.roles.length ? p.roles.map((role) => <span key={role} className={`portal-badge ${role === "admin" || role === "head_teacher" ? "portal-badge-gold" : role === "teacher" ? "portal-badge-gray" : "portal-badge-blue"}`}>{roleLabel(role)}</span>) : <span className="portal-badge portal-badge-gray">No access</span>}</span></td>
            <td><span className="portal-badge portal-badge-green">Active</span></td>
            <td><button className="portal-text-link" onClick={() => setAccessUserId(p.id)}>Edit access</button></td>
          </tr>)}</tbody></table>
          {people.length === 0 && <p className="portal-empty">No one matches that search.</p>}
        </div><div className="portal-table-foot"><span>{people.length} accounts</span></div>
      </Card>}

      {show === "students" && <Card title="Student directory" subtitle="Search, filter and review student accounts" bodyClass="!p-0">
        <div className="portal-toolbar"><input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search by student name…" className={`${field} portal-search`} aria-label="Search students" />
          <select value={cf} onChange={(e) => { setCf(e.target.value); setPage(0); }} className={field} aria-label="Filter by class"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={sf} onChange={(e) => { setSf(e.target.value); setPage(0); }} className={field} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        {filtered.length === 0 ? <p className="portal-empty">{students.length ? "No students match these filters." : "No students yet."}</p> : <>
          <div className="portal-table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Student login</th><th>Parent / guardian</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{shown.map((student) => <tr key={student.id}>
              <td><div className="portal-person"><span className="portal-person-avatar">{initialsFor(student.full_name)}</span><b>{student.full_name}</b></div></td><td>{student.class_name}</td><td>{userName(student.student_user_id)}</td><td>{userName(student.guardian_user_id)}</td>
              <td><span className={`portal-badge ${student.active ? "portal-badge-green" : "portal-badge-gray"}`}>{student.active ? "Active" : "Inactive"}</span></td>
              <td><button className="portal-text-link" onClick={() => { setEditingId(student.id); setStudentOpen(true); }} aria-label={`Edit ${student.full_name}`}>Edit record</button></td>
            </tr>)}</tbody></table></div>
          <div className="portal-table-foot"><span>Showing {filtered.length} student records · page {page + 1} of {pages}</span><div className="portal-pagination">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous student page"><ChevronLeft /></button><button className="current" aria-current="page">{page + 1}</button><button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next student page"><ChevronRight /></button>
          </div></div>
        </>}
      </Card>}

      {show === "fees" && isAdmin && <Card title="Fees and payment records" subtitle="Filter the ledger, add fee entries and record receipts." bodyClass="!p-0">
        <div className="portal-fee-summary"><div className="portal-fee-chip"><small>Total collected</small><b>{cedi(collected)}</b></div><div className="portal-fee-chip"><small>Outstanding balance</small><b>{cedi(outstanding)}</b></div><div className="portal-fee-chip"><small>Receipts issued</small><b>{receiptsIssued}</b></div></div>
        <div className="portal-toolbar"><input value={feeQuery} onChange={(e) => setFeeQuery(e.target.value)} placeholder="Search student or receipt…" className={`${field} portal-search`} aria-label="Search fees" /><select value={feeStatus} onChange={(e) => setFeeStatus(e.target.value)} className={field} aria-label="Filter fees by status"><option value="all">All statuses</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></div>
        <FeeTable fees={visibleFees} onPay={markPaid} /><div className="portal-table-foot"><span>{visibleFees.length} fee records</span></div>
      </Card>}

      {show === "classes" && <AssignmentsCard teachers={profiles.filter((p) => p.roles.includes("teacher"))} classes={classes} />}
      {show === "announcements" && <div className="portal-grid-main"><EventsCard /><StaffTools userId={userId} show={show} /></div>}
      {show === "reports" && isAdmin && <ReportsCard fees={fees} students={students} userName={userName} />}
      {show === "settings" && isAdmin && <SchoolSettings />}

      <Dialog open={studentOpen} onOpenChange={(open) => { setStudentOpen(open); if (!open) setEditingId(null); }}>
        <DialogContent className="portal-app portal-dialog"><DialogHeader><DialogTitle>{editingId ? "Edit student" : "Add student"}</DialogTitle><DialogDescription>Update the student record and optional family account links.</DialogDescription></DialogHeader>
          <form key={editingId ?? "new"} onSubmit={addStudent} className="portal-form-grid">
            <label className="portal-field"><span>Student full name</span><input name="name" defaultValue={editing?.full_name} required placeholder="Full name" className={field} /></label>
            <label className="portal-field"><span>Class</span><input name="class" list="class-list" defaultValue={editing?.class_name} required placeholder="e.g. Basic 4" className={field} /><datalist id="class-list">{classes.map((c) => <option key={c} value={c} />)}</datalist></label>
            <label className="portal-field"><span>Student login (optional)</span><select name="student_user" defaultValue={editing?.student_user_id ?? ""} className={field}><option value="">No linked login</option>{profiles.filter((p) => p.roles.includes("student")).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select></label>
            <label className="portal-field"><span>Parent login (optional)</span><select name="guardian" defaultValue={editing?.guardian_user_id ?? ""} className={field}><option value="">No linked login</option>{profiles.filter((p) => p.roles.includes("parent")).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select></label>
            <label className="portal-checkline portal-field-full"><input name="active" type="checkbox" defaultChecked={editing?.active ?? true} />Active student record</label>
            <div className="portal-form-actions portal-field-full"><button type="button" className="portal-btn" onClick={() => setStudentOpen(false)}>Cancel</button><button className="btn-primary">{editingId ? "Save student" : "Add student"}</button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={feeOpen} onOpenChange={setFeeOpen}><DialogContent className="portal-app portal-dialog"><DialogHeader><DialogTitle>Add fee</DialogTitle><DialogDescription>Create a charge or record a payment in Ghana Cedi.</DialogDescription></DialogHeader>
        <form onSubmit={addFee} className="portal-form-grid">
          <label className="portal-field portal-field-full"><span>Student</span><select name="student" required className={field}><option value="">Choose student</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select></label>
          <label className="portal-field portal-field-full"><span>Description</span><input name="description" required placeholder="e.g. Term 1 tuition" className={field} /></label>
          <label className="portal-field"><span>Amount (GH₵)</span><input name="amount" type="number" step="0.01" min="0.01" required placeholder="0.00" className={field} /></label>
          <label className="portal-field"><span>Status</span><select name="status" className={field}><option value="unpaid">Unpaid</option><option value="paid">Paid now</option></select></label>
          <label className="portal-field portal-field-full"><span>Payment method</span><select name="method" className={field}><option>Mobile Money</option><option>Cash</option><option>Bank transfer</option></select></label>
          <div className="portal-form-actions portal-field-full"><button type="button" className="portal-btn" onClick={() => setFeeOpen(false)}>Cancel</button><button className="btn-primary">Save fee</button></div>
        </form>
      </DialogContent></Dialog>

      <Dialog open={Boolean(accessProfile)} onOpenChange={(open) => { if (!open) setAccessUserId(null); }}><DialogContent className="portal-app portal-dialog"><DialogHeader><DialogTitle>Edit account</DialogTitle><DialogDescription>{accessProfile?.full_name} · {accessProfile?.email}</DialogDescription></DialogHeader>
        {accessProfile && <div className="space-y-4">
          {isAdmin && <form onSubmit={(e) => { e.preventDefault(); void renameUser(accessProfile.id, String(new FormData(e.currentTarget).get("account_name"))); }} className="flex items-end gap-2"><label className="portal-field flex-1"><span>Full name</span><input key={accessProfile.id} name="account_name" defaultValue={accessProfile.full_name} className={field} maxLength={120} /></label><button className="portal-btn">Save name</button></form>}
          <div><p className="mb-2 text-[11px] font-bold text-primary">Access roles</p><div className="grid gap-2">{ROLES.map((role) => { const has = accessProfile.roles.includes(role); return <label key={role} className="portal-checkline"><input type="checkbox" checked={has} disabled={!canChangeRole(roles, accessProfile.roles, role, accessProfile.id === userId)} onChange={() => toggleRole(accessProfile.id, role, has)} />{roleLabel(role)}</label>; })}</div></div>
          <div className="portal-form-actions"><button className="btn-primary" onClick={() => setAccessUserId(null)}>Done</button></div>
        </div>}
      </DialogContent></Dialog>
    </>
  );
}

type FeeRow = ReturnType<typeof useFees>["data"] extends (infer T)[] | undefined ? T : never;

function FeeTable({ fees, onPay }: { fees: FeeRow[]; onPay?: (id: string) => void }) {
  if (fees.length === 0) return <p className="portal-empty">No fee records match this view.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground"><th className="py-2">Student</th><th>Description</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
        <tbody>{fees.map((f) => (
          <tr key={f.id} className="border-t">
            <td className="py-2 font-semibold">{f.students?.full_name}</td><td>{f.description}</td><td>{cedi(f.amount)}</td>
            <td><span className={`portal-badge ${f.status === "paid" ? "portal-badge-green" : "portal-badge-gold"}`}>{f.status === "paid" ? "Paid" : "Unpaid"}</span></td>
            <td>{f.status === "paid"
              ? <Link to="/receipt/$id" params={{ id: f.id }} className="portal-text-link">{f.receipt_no}</Link>
              : onPay ? <button onClick={() => onPay(f.id)} className="portal-text-link">Record payment</button> : "—"}</td>
          </tr>))}</tbody>
      </table>
    </div>
  );
}

function EventsCard() {
  const qc = useQueryClient();
  const { data: events = [] } = useQuery({ queryKey: ["events"], queryFn: async () => (await supabase.from("events").select("*").order("event_date")).data ?? [] });
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const { error } = await supabase.from("events").insert({ title: String(f.get("title")), event_date: String(f.get("date")), place: String(f.get("place")), description: String(f.get("description")) });
    if (error) toast.error(error.message); else { toast.success("Event posted to the website"); form.reset(); qc.invalidateQueries({ queryKey: ["events"] }); }
  }
  async function remove(id: string) {
    if (!confirm("Remove this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["events"] });
  }
  return (
    <Card title="Create school event" subtitle="Add a date and place so families can plan ahead.">
      <form onSubmit={add} className="portal-form-grid mb-5">
        <label className="portal-field"><span>Event name</span><input name="title" required placeholder="e.g. Speech Day" className={field} /></label>
        <label className="portal-field"><span>Date</span><input name="date" type="date" required className={field} /></label>
        <label className="portal-field"><span>Place</span><input name="place" placeholder="Location" className={field} /></label>
        <label className="portal-field"><span>Short note</span><input name="description" placeholder="Optional details" className={field} /></label>
        <div className="portal-form-actions portal-field-full"><button className="btn-primary" type="submit">Post event</button></div>
      </form>
      {events.length === 0 ? <p className="portal-empty">No events yet. Events you post appear on the public News & Events page.</p> : (
        <ul className="space-y-2">{events.map((ev) => <li key={ev.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span><b>{ev.title}</b> · {ev.event_date}{ev.place && ` · ${ev.place}`}</span><button className="portal-text-link" onClick={() => remove(ev.id)}>Remove</button></li>)}</ul>
      )}
    </Card>
  );
}

function ReportsCard({ fees, students, userName }: { fees: FeeRow[]; students: { full_name: string; class_name: string; active: boolean; student_user_id: string | null; guardian_user_id: string | null }[]; userName: (id: string | null) => string }) {
  const [cls, setCls] = useState("");
  const classes = [...new Set(students.map((s) => s.class_name))].sort();
  const feeRow = (f: FeeRow) => [f.students?.full_name, f.students?.class_name, f.description, Number(f.amount).toFixed(2), f.status, f.payment_method, f.paid_on, f.receipt_no];
  const feeHead = ["Student", "Class", "Description", "Amount (GHS)", "Status", "Method", "Paid on", "Receipt"];
  async function marks() {
    let q = supabase.from("marks").select("subject, assessment, term, score, max_score, published, students!inner(full_name, class_name)").order("term");
    if (cls) q = q.eq("students.class_name", cls);
    const { data, error } = await q;
    if (error) { toast.error(error.message); return; }
    downloadPdfReport(`Marks Report — ${cls || "All Classes"}`, ["Student", "Class", "Subject", "Assessment", "Term", "Score", "Out of", "Published"],
      (data ?? []).map((m) => [m.students?.full_name, m.students?.class_name, m.subject, m.assessment, m.term, m.score, m.max_score, m.published ? "Yes" : "No"]));
  }
  return (
    <Card title="Report downloads">
      <p className="mb-4 text-sm text-muted-foreground">Download PDF reports, each titled and stamped with the date it was generated.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => downloadPdfReport("Fees & Payments Report", feeHead, fees.map(feeRow))}>Fees & payments</Button>
        <Button variant="outline" onClick={() => downloadPdfReport("Unpaid Fees Report", feeHead.slice(0, 5), fees.filter((f) => f.status === "unpaid").map((f) => feeRow(f).slice(0, 5)))}>Unpaid fees</Button>
        <Button variant="outline" onClick={() => downloadPdfReport("Student List", ["Name", "Class", "Status", "Student login", "Parent"], students.map((s) => [s.full_name, s.class_name, s.active ? "Active" : "Inactive", userName(s.student_user_id), userName(s.guardian_user_id)]))}>Student list</Button>
        <span className="flex items-center gap-2">
          <select value={cls} onChange={(e) => setCls(e.target.value)} className={field + " !w-auto"} aria-label="Class for marks report"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <Button variant="outline" onClick={marks}>Marks by class</Button>
        </span>
      </div>
    </Card>
  );
}

function AssignmentsCard({ teachers, classes }: { teachers: { id: string; full_name: string; email: string }[]; classes: string[] }) {
  const qc = useQueryClient();
  const { data: settings = defaultSchoolSettings() } = useSchoolSettings();
  const { data: rows = [] } = useQuery({ queryKey: ["assignments"], queryFn: async () => (await supabase.from("teacher_assignments").select("*").order("class_name")).data ?? [] });
  const name = (id: string) => { const t = teachers.find((x) => x.id === id); return t?.full_name || t?.email || "—"; };
  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const { error } = await supabase.from("teacher_assignments").insert({ teacher_id: String(f.get("teacher")), class_name: String(f.get("class")), subject: String(f.get("subject")).trim() });
    if (error) toast.error(error.code === "23505" ? "That teacher already has this class and subject." : error.message);
    else { toast.success("Teacher assigned"); form.reset(); qc.invalidateQueries({ queryKey: ["assignments"] }); }
  }
  async function remove(id: string) {
    const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["assignments"] });
  }
  const assignedClasses = new Set(rows.map((row) => row.class_name));
  const stats = [
    ["Class groups", classes.length, "Classes with student records"],
    ["Subjects", new Set(rows.map((row) => row.subject)).size, "Current teacher assignments"],
    ["Teacher assignments", rows.length, `School year ${settings.academic_year}`],
    ["Unassigned classes", classes.filter((name) => !assignedClasses.has(name)).length, "Review class coverage"],
  ] as const;
  return (
    <>
      <Card title="Teacher assignments" subtitle="Assignments keep class responsibilities easy to review." bodyClass="!p-0">
        <form onSubmit={add} className="portal-toolbar portal-assignment-form">
          <select name="teacher" required className={field} aria-label="Teacher"><option value="">Select teacher</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}</select>
          <select name="class" required className={field} aria-label="Class to assign"><option value="">Select class</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <input name="subject" required placeholder="Subject / responsibility" className={field} aria-label="Subject to assign" />
          <button className="btn-primary" type="submit">Assign teacher</button>
        </form>
        {rows.length === 0 ? <p className="portal-empty">No assignments yet.</p> : <div className="portal-table-wrap"><table><thead><tr><th>Teacher</th><th>Class</th><th>Subject / responsibility</th><th>Action</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.id}><td><div className="portal-person"><span className="portal-person-avatar">{initialsFor(name(row.teacher_id))}</span><b>{name(row.teacher_id)}</b></div></td><td><span className="portal-badge portal-badge-blue">{row.class_name}</span></td><td>{row.subject}</td><td><button className="portal-text-link" onClick={() => remove(row.id)}>Remove</button></td></tr>)}</tbody>
        </table></div>}
      </Card>
      <div className="portal-grid-stats">{stats.map(([label, value, note]) => <article className="portal-stat" key={label}><p className="text-[11px] font-semibold text-muted-foreground">{label}</p><p className="portal-stat-value">{value}</p><p className="portal-stat-note">{note}</p></article>)}</div>
    </>
  );
}

function FamilyArea({ studentId, compact }: { studentId: string | null; compact?: boolean }) {
  const { data: all = [] } = useFees();
  const fees = all.filter((f) => !studentId || f.student_id === studentId);
  const owed = fees.filter((f) => f.status === "unpaid").reduce((s, f) => s + Number(f.amount), 0);
  const paid = fees.filter((f) => f.status === "paid");
  if (compact) return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <Link to="/portal" search={{ s: "fees" }} className="portal-stat hover:border-primary"><p className="text-xs text-muted-foreground">Fee balance due</p><p className={`portal-stat-value mt-1 ${owed > 0 ? "text-destructive" : ""}`}>{cedi(owed)}</p></Link>
      <Link to="/portal" search={{ s: "fees" }} className="portal-stat hover:border-primary"><p className="text-xs text-muted-foreground">Receipts available</p><p className="portal-stat-value mt-1">{paid.length}</p></Link>
    </div>
  );
  return (
    <Card title="Fees & receipts" action={<span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold">Balance due: {cedi(owed)}</span>}>
      <p className="mb-3 text-sm text-muted-foreground">Click a receipt number to open it, then use Print / Save as PDF to download.</p>
      <FeeTable fees={fees} />
    </Card>
  );
}
