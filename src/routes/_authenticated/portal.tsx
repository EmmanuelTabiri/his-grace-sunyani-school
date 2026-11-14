import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import logo from "@/assets/school-logo.png.asset.json";
import { Bell, BookOpen, ClipboardList, FileText, GraduationCap, LayoutDashboard, Megaphone, Menu, NotebookPen, Receipt, School, Table2, UserCog, type LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cedi } from "@/lib/money";
import { downloadPdfReport } from "@/lib/report-pdf";
import { StaffTools, FamilyLearning, MyClasses, Gradebook, DraftCount } from "@/components/portal/Classroom";
import { EventsPanel, LeaderOverview, OverviewHeader } from "@/components/portal/Overview";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { meta } from "@/components/SiteLayout";
import { ROLES, roleLabel, canChangeRole, type Role } from "@/lib/portal-access";
import { portalSections, schoolYear, type SectionId } from "@/lib/portal-nav";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => { const tags = meta("School Portal", "Manage students, teachers, learning and school fees at His Grace Academy."); return { ...tags, meta: [...tags.meta, { name: "robots", content: "noindex" }] }; },
  validateSearch: (s: Record<string, unknown>): { s?: string } => (typeof s["s"] === "string" ? { s: s["s"] as string } : {}),
  component: Portal,
});

const field = "w-full rounded-lg border bg-background px-3 py-2";
const ICONS: Record<SectionId, LucideIcon> = { overview: LayoutDashboard, students: GraduationCap, staff: UserCog, classes: School, gradebook: Table2, marks: ClipboardList, results: ClipboardList, homework: BookOpen, announcements: Megaphone, diary: NotebookPen, fees: Receipt, reports: FileText };
const PAGE_DESCRIPTIONS: Record<SectionId, string> = {
  overview: "A clear view of what’s happening across your school.",
  students: "Manage student records, class placement and family links.",
  staff: "Manage portal access for staff, students and parents.",
  classes: "Review class groups, subjects and teacher assignments.",
  gradebook: "Review class assessments, drafts and published results.",
  marks: "Enter assessment scores and choose whether to publish them.",
  results: "View published marks, scores and teacher feedback.",
  homework: "Create and review homework with clear class and due-date details.",
  announcements: "Share important updates and event details with the school community.",
  diary: "Share and review concise daily summaries of topics studied.",
  fees: "Track student charges, payment status and receipt references.",
  reports: "Download titled, date-stamped PDF reports for school records.",
};

function PageIntro({ section, family, title }: { section: SectionId; family: boolean; title: string }) {
  const description = family && section === "homework"
    ? "View instructions, attachments and upcoming due dates."
    : family && section === "announcements"
      ? "Read school updates and upcoming event details."
      : family && section === "fees"
        ? "View your fee balance, payment history and official receipts."
        : PAGE_DESCRIPTIONS[section];
  return <section className="portal-page-heading"><div><p className="portal-overline">His Grace Academy · {schoolYear()}</p><h1>{section === "marks" ? "Record marks" : title}</h1><p>{description}</p></div></section>;
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
  const managementIds: SectionId[] = ["staff", "fees", "reports"];
  const orderedSections = isLeader ? [...sections].sort((a, b) => Number(managementIds.includes(a.id)) - Number(managementIds.includes(b.id))) : sections;
  const nav = (
    <nav aria-label="Portal sections" className="flex-1 space-y-1 overflow-y-auto">
      {orderedSections.map((x, index) => {
        const Icon = ICONS[x.id];
        const active = x.id === s;
        const management = isLeader && managementIds.includes(x.id);
        const previousManagement = index > 0 && isLeader && managementIds.includes(orderedSections[index - 1]?.id ?? "overview");
        return (
          <div key={x.id}>
            {(index === 0 || management !== previousManagement) && <p className="portal-nav-title">{management ? "Administration" : "Portal"}</p>}
            <Link to="/portal" search={{ s: x.id }} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
              className={`portal-nav-link ${active ? "portal-nav-active" : ""}`}>
              <Icon className="h-4 w-4 shrink-0" />{x.label}
            </Link>
          </div>
        );
      })}
    </nav>
  );
  const brand = (
    <Link to="/" className="flex items-center gap-2.5">
      <img src={logo.url} alt="His Grace Academy logo" width={40} height={40} className="h-10 w-10 shrink-0 rounded-lg bg-card object-contain" />
      <span className="min-w-0 leading-tight"><span className="portal-brand block truncate">His Grace Academy</span><span className="portal-brand-subtitle mt-1 block">School management</span></span>
    </Link>
  );
  const schoolChip = <div className="portal-school-chip"><span className="portal-school-mark"><School className="h-4 w-4" /></span><span className="min-w-0"><b className="block truncate text-[11px] text-primary">His Grace Academy</b><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{isLeader ? "Administration workspace" : isTeacher ? "Teacher workspace" : "Family workspace"}</span></span></div>;
  const account = <div className="flex items-center gap-2.5"><span className="portal-avatar">{firstName.charAt(0).toUpperCase() || "?"}</span><span className="min-w-0"><b className="block truncate text-[11px] text-primary">{me?.full_name || "My account"}</b><span className="block truncate text-[10px] text-muted-foreground">{roles.map(roleLabel).join(", ")}</span></span></div>;

  return (
    <div className="portal-app flex min-h-screen w-full">
      {roles.length > 0 && <aside className="portal-sidebar sticky top-0 hidden h-screen w-[246px] shrink-0 flex-col gap-4 border-r p-4 lg:flex">
        <div className="border-b px-1 pb-4 pt-1">{brand}</div>{schoolChip}{nav}
        <div className="border-t px-1 pt-4">{account}</div>
      </aside>}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="portal-topbar sticky top-0 z-20 border-b">
          <div className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              {roles.length > 0 && <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild><button className="rounded-lg border p-2 lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button></SheetTrigger>
                <SheetContent side="left" className="portal-app portal-sidebar w-72 border-r p-4"><SheetTitle className="sr-only">Portal menu</SheetTitle><div className="flex h-full flex-col gap-4"><div className="border-b px-1 pb-4 pt-1">{brand}</div>{schoolChip}{nav}<div className="border-t px-1 pt-4">{account}</div></div></SheetContent>
              </Sheet>}
              <div className="min-w-0"><p className="truncate text-[11px] text-muted-foreground"><span>Portal</span><span className="mx-2">›</span><strong className="font-bold text-foreground">{current?.label ?? "Overview"}</strong></p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-lg border bg-muted px-3 py-2 text-[11px] font-semibold text-muted-foreground md:block">{schoolYear()}</span>
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
                  <span className="hidden min-w-0 sm:block"><b className="block max-w-40 truncate text-xs">{me?.full_name || "My account"}</b><span className="block text-xs text-muted-foreground">{roles.map(roleLabel).join(", ") || "Awaiting access"}</span></span>
                  <span className="portal-avatar">{firstName.charAt(0).toUpperCase() || "?"}</span>
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

        <main className="mx-auto w-full max-w-[1500px] space-y-4 px-4 py-6 sm:px-7 sm:py-7">
          {isLoading ? <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-card" />)}</div> : roles.length === 0 ? (
            <Card title="Awaiting access"><p className="text-muted-foreground">Your account is registered. The school office will assign your access (teacher, student or parent) shortly.</p></Card>
          ) : (
            <>
              {s === "overview" ? <OverviewHeader firstName={firstName} roles={roles} /> : <PageIntro section={s} family={isFamily} title={current?.label ?? "Portal"} />}
              {isLeader && s === "overview" && <LeaderOverview roles={roles} />}
              {isLeader && <AdminArea roles={roles} userId={user.id} show={s} />}
              {isTeacher && (s === "overview" || s === "classes") && <>
                {s === "overview" && <div className="grid gap-4 sm:max-w-sm">
                  <Link to="/portal" search={{ s: "gradebook" }} className="portal-stat block transition-colors hover:border-primary"><p className="text-xs text-muted-foreground">Marks still in draft</p><p className="portal-stat-value mt-1"><DraftCount userId={user.id} /></p><p className="mt-1 text-[11px] text-muted-foreground">Open the gradebook to review and publish</p></Link>
                </div>}
                <MyClasses userId={user.id} show={s} />
              </>}
              {isStaff && s === "gradebook" && <Gradebook userId={user.id} />}
              {isStaff && <StaffTools userId={user.id} show={s} />}
              {isFamily && <>
                {kids.length > 1 && <div role="tablist" aria-label="Choose child" className="flex flex-wrap gap-2">{kids.map((k) => (
                  <button key={k.id} role="tab" aria-selected={kid?.id === k.id} onClick={() => setKidId(k.id)} className={`rounded-full border px-4 py-2 text-sm font-bold ${kid?.id === k.id ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{k.full_name}</button>))}</div>}
                {s === "overview" && <section className="portal-panel p-5">
                  <p className="text-sm text-muted-foreground">Student overview</p>
                  <h2 className="mt-1 text-2xl font-extrabold">{kid ? kid.full_name : "No student linked yet"}</h2>
                  <p className="mt-1 text-primary">{kid ? `${kid.class_name} · School year ${schoolYear()}` : "The school office will link your account to a student."}</p>
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


function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="portal-panel">
      <div className="portal-panel-head"><h2>{title}</h2>{action}</div>
      <div className="portal-panel-body">{children}</div>
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
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const { data: students = [] } = useStudents();
  const { data: fees = [] } = useFees(isAdmin);
  const editing = students.find((s) => s.id === editingId);
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

  async function renameUser(id: string, current: string) {
    const name = prompt("Full name:", current)?.trim();
    if (!name || name === current) return;
    const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Name updated"); refresh(); }
  }

  async function addStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const values = {
      full_name: String(f.get("name")), class_name: String(f.get("class")),
      student_user_id: (f.get("student_user") as string) || null, guardian_user_id: (f.get("guardian") as string) || null,
    };
    const { error } = editingId
      ? await supabase.from("students").update(values).eq("id", editingId)
      : await supabase.from("students").insert(values);
    if (error) toast.error(error.message); else { toast.success(editingId ? "Student updated" : "Student added"); form.reset(); setEditingId(null); refresh(); }
  }

  async function toggleActive(id: string, active: boolean) {
    const { error } = await supabase.from("students").update({ active: !active }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(active ? "Student deactivated" : "Student reactivated"); refresh(); }
  }

  async function addFee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const amount = Number(f.get("amount"));
    if (!(amount > 0)) { toast.error("Enter an amount greater than 0"); return; }
    const paid = f.get("status") === "paid";
    const { error } = await supabase.from("fees").insert({
      student_id: String(f.get("student")), description: String(f.get("description")), amount,
      status: paid ? "paid" : "unpaid", payment_method: paid ? String(f.get("method")) : null,
    });
    if (error) toast.error(error.message); else { toast.success(paid ? "Payment recorded — receipt created" : "Fee added"); form.reset(); refresh(); }
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
  const PER = 10; const pages = Math.max(1, Math.ceil(filtered.length / PER)); const shown = filtered.slice(page * PER, page * PER + PER);
  const [uq, setUq] = useState("");
  const people = profiles.filter((p) => (isAdmin || p.roles.some((r) => r === "teacher") || p.roles.length === 0) && `${p.full_name} ${p.email}`.toLowerCase().includes(uq.toLowerCase()));
  const collected = fees.filter((fee) => fee.status === "paid").reduce((sum, fee) => sum + Number(fee.amount), 0);
  const outstanding = fees.filter((fee) => fee.status === "unpaid").reduce((sum, fee) => sum + Number(fee.amount), 0);
  const receiptsIssued = fees.filter((fee) => fee.status === "paid" && fee.receipt_no).length;

  return (
    <>
      {show === "staff" && <Card title={isAdmin ? "People & role access" : "Teachers & access"}>
        <p className="mb-3 text-sm text-muted-foreground">To add a staff member or parent, ask them to create an account on the portal sign-in page, then tick their access here.</p>
        <input value={uq} onChange={(e) => setUq(e.target.value)} placeholder="Search by name or email" className={field + " mb-3 max-w-sm"} aria-label="Search people" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Name</th><th>Email</th>{ROLES.map((r) => <th key={r}>{roleLabel(r)}</th>)}</tr></thead>
            <tbody>{people.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2 font-semibold">{p.full_name || "—"}{isAdmin && <button className="ml-2 text-xs font-bold text-primary" onClick={() => renameUser(p.id, p.full_name)} aria-label={`Edit name for ${p.email}`}>Edit</button>}</td><td>{p.email}</td>
                {ROLES.map((r) => { const has = p.roles.includes(r); return (
                  <td key={r}><input type="checkbox" aria-label={`${roleLabel(r)} access for ${p.email}`} checked={has} disabled={!canChangeRole(roles, p.roles, r, p.id === userId)} onChange={() => toggleRole(p.id, r, has)} /></td>
                ); })}
              </tr>))}</tbody>
          </table>
          {people.length === 0 && <p className="py-4 text-muted-foreground">No one matches that search.</p>}
        </div>
      </Card>}

      {show === "students" && <Card title="Student directory">
        <form key={editingId ?? "new"} onSubmit={addStudent} className="mb-5 grid gap-3 md:grid-cols-5">
          <input name="name" defaultValue={editing?.full_name} required placeholder="Student full name" className={field} aria-label="Student full name" />
          <input name="class" list="class-list" defaultValue={editing?.class_name} required placeholder="Class e.g. Basic 4" className={field} aria-label="Class" />
          <datalist id="class-list">{classes.map((c) => <option key={c} value={c} />)}</datalist>
          <select name="student_user" defaultValue={editing?.student_user_id ?? ""} className={field} aria-label="Student login"><option value="">Student login (optional)</option>
            {profiles.filter((p) => p.roles.includes("student")).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select>
          <select name="guardian" defaultValue={editing?.guardian_user_id ?? ""} className={field} aria-label="Parent login"><option value="">Parent login (optional)</option>
            {profiles.filter((p) => p.roles.includes("parent")).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select>
          <Button type="submit">{editingId ? "Save student" : "Add student"}</Button>
          {editingId && <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>}
        </form>
        <div className="mb-3 grid gap-3 sm:grid-cols-3">
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search students" className={field} aria-label="Search students" />
          <select value={cf} onChange={(e) => { setCf(e.target.value); setPage(0); }} className={field} aria-label="Filter by class"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={sf} onChange={(e) => { setSf(e.target.value); setPage(0); }} className={field} aria-label="Filter by status"><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select>
        </div>
        {filtered.length === 0 ? <p className="text-muted-foreground">{students.length ? "No students match these filters." : "No students yet."}</p> : (<>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Name</th><th>Class</th><th>Student login</th><th>Parent</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{shown.map((s) => <tr key={s.id} className="border-t"><td className="py-2 font-semibold">{s.full_name}</td><td>{s.class_name}</td><td>{userName(s.student_user_id)}</td><td>{userName(s.guardian_user_id)}</td><td><span className={`portal-badge ${s.active ? "portal-badge-green" : "portal-badge-gray"}`}>{s.active ? "Active" : "Inactive"}</span></td><td className="whitespace-nowrap"><Button variant="link" onClick={() => { setEditingId(s.id); window.scrollTo({ top: 0, behavior: "smooth" }); }} aria-label={`Edit ${s.full_name}`}>Edit</Button><Button variant="link" onClick={() => toggleActive(s.id, s.active)}>{s.active ? "Deactivate" : "Reactivate"}</Button></td></tr>)}</tbody></table></div>
          <div className="mt-3 flex items-center justify-between text-sm"><span className="text-muted-foreground">{filtered.length} students · page {page + 1} of {pages}</span>
            <span className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</Button></span></div>
        </>)}
      </Card>}

      {show === "fees" && isAdmin && <Card title="Fees and payment records">
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="portal-fee-chip"><small>Total collected</small><b>{cedi(collected)}</b></div>
          <div className="portal-fee-chip"><small>Outstanding balance</small><b>{cedi(outstanding)}</b></div>
          <div className="portal-fee-chip"><small>Receipts issued</small><b>{receiptsIssued}</b></div>
        </div>
        <form onSubmit={addFee} className="mb-5 grid gap-3 md:grid-cols-6">
          <select name="student" required className={field} aria-label="Student"><option value="">Student…</option>{students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}</select>
          <input name="description" required placeholder="e.g. Term 1 tuition" className={field} aria-label="Fee description" />
          <input name="amount" type="number" step="0.01" min="0.01" required placeholder="Amount (GH₵)" className={field} aria-label="Amount in Ghana Cedi" />
          <select name="status" className={field} aria-label="Status"><option value="unpaid">Unpaid</option><option value="paid">Paid now</option></select>
          <select name="method" className={field} aria-label="Payment method"><option>Mobile Money</option><option>Cash</option><option>Bank transfer</option></select>
          <button className="btn-primary justify-center">Save fee</button>
        </form>
        <FeeTable fees={fees} onPay={markPaid} />
        <p className="mt-4 text-xs text-muted-foreground">Emailing receipts will be switched on once the school has its own email address set up. For now, open a receipt and use Print / Save as PDF.</p>
      </Card>}

      {show === "classes" && <AssignmentsCard teachers={profiles.filter((p) => p.roles.includes("teacher"))} classes={classes} />}
      {show === "announcements" && <EventsCard />}
      {show === "reports" && isAdmin && <ReportsCard fees={fees} students={students} userName={userName} />}
    </>
  );
}

type FeeRow = ReturnType<typeof useFees>["data"] extends (infer T)[] | undefined ? T : never;

function FeeTable({ fees, onPay }: { fees: FeeRow[]; onPay?: (id: string) => void }) {
  if (fees.length === 0) return <p className="text-muted-foreground">No fee records yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-muted-foreground"><th className="py-2">Student</th><th>Description</th><th>Amount</th><th>Status</th><th>Receipt</th></tr></thead>
        <tbody>{fees.map((f) => (
          <tr key={f.id} className="border-t">
            <td className="py-2 font-semibold">{f.students?.full_name}</td><td>{f.description}</td><td>{cedi(f.amount)}</td>
            <td><span className={`portal-badge ${f.status === "paid" ? "portal-badge-green" : "portal-badge-gold"}`}>{f.status === "paid" ? "Paid" : "Unpaid"}</span></td>
            <td>{f.status === "paid"
              ? <Link to="/receipt/$id" params={{ id: f.id }} className="font-bold text-primary">{f.receipt_no}</Link>
              : onPay ? <button onClick={() => onPay(f.id)} className="font-bold text-primary">Record payment</button> : "—"}</td>
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
    <Card title="School events">
      <form onSubmit={add} className="mb-5 grid gap-3 md:grid-cols-5">
        <input name="title" required placeholder="Event e.g. Speech Day" className={field} aria-label="Event title" />
        <input name="date" type="date" required className={field} aria-label="Event date" />
        <input name="place" placeholder="Place" className={field} aria-label="Event place" />
        <input name="description" placeholder="Short note (optional)" className={field} aria-label="Event note" />
        <Button type="submit">Post event</Button>
      </form>
      {events.length === 0 ? <p className="text-muted-foreground">No events yet. Events you post appear on the public News & Events page.</p> : (
        <ul className="space-y-2">{events.map((ev) => <li key={ev.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span><b>{ev.title}</b> · {ev.event_date}{ev.place && ` · ${ev.place}`}</span><Button variant="link" onClick={() => remove(ev.id)}>Remove</Button></li>)}</ul>
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
  return (
    <Card title="Teacher assignments">
      <form onSubmit={add} className="mb-5 grid gap-3 md:grid-cols-4">
        <select name="teacher" required className={field} aria-label="Teacher"><option value="">Teacher…</option>{teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}</select>
        <select name="class" required className={field} aria-label="Class to assign"><option value="">Class…</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
        <input name="subject" required placeholder="Subject e.g. Mathematics" className={field} aria-label="Subject to assign" />
        <Button type="submit">Assign</Button>
      </form>
      {rows.length === 0 ? <p className="text-muted-foreground">No assignments yet.</p> : (
        <ul className="space-y-2">{rows.map((r) => <li key={r.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span><b>{name(r.teacher_id)}</b> · {r.class_name} · {r.subject}</span><Button variant="link" onClick={() => remove(r.id)}>Remove</Button></li>)}</ul>
      )}
    </Card>
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
