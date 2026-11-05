import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cedi } from "@/lib/money";
import { downloadCsv } from "@/lib/reports";
import { StaffTools, FamilyLearning } from "@/components/portal/Classroom";
import { Button } from "@/components/ui/button";
import { meta } from "@/components/SiteLayout";
import { ROLES, roleLabel, canChangeRole, type Role } from "@/lib/portal-access";

export const Route = createFileRoute("/_authenticated/portal")({
  head: () => { const tags = meta("School Portal", "Manage students, teachers, learning and school fees at His Grace Academy."); return { ...tags, meta: [...tags.meta, { name: "robots", content: "noindex" }] }; },
  component: Portal,
});

const field = "w-full rounded-xl border bg-background px-3 py-2";

function Portal() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["my-roles", user.id],
    queryFn: async () => (await supabase.from("user_roles").select("role").eq("user_id", user.id)).data?.map((r) => r.role) ?? [],
  });
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-navy text-navy-foreground">
        <div className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="font-display text-lg font-extrabold">His Grace Academy <span className="text-secondary">Portal</span></Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline opacity-80">{user.email} · {roles.map(roleLabel).join(", ") || "no role"}</span>
            <button onClick={signOut} className="btn-sun !py-2">Sign out</button>
          </div>
        </div>
      </header>
      <main className="container-page space-y-8 py-8">
        {isLoading ? <p>Loading…</p> : roles.length === 0 ? (
          <Card title="Awaiting access"><p className="text-muted-foreground">Your account is registered. The school office will assign your access (teacher, student or parent) shortly.</p></Card>
        ) : (
          <>
            {(roles.includes("admin") || roles.includes("head_teacher")) && <AdminArea roles={roles} userId={user.id} />}
            {roles.includes("teacher") && !roles.includes("admin") && !roles.includes("head_teacher") && <TeacherArea />}
            {(roles.includes("admin") || roles.includes("head_teacher") || roles.includes("teacher")) && <StaffTools userId={user.id} />}
            {(roles.includes("student") || roles.includes("parent")) && <><FamilyLearning /><FamilyArea /></>}
          </>
        )}
      </main>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4"><h2 className="text-xl font-extrabold">{title}</h2>{action}</div>
      {children}
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

function AdminArea({ roles, userId }: { roles: Role[]; userId: string }) {
  const isAdmin = roles.includes("admin");
  const [editingId, setEditingId] = useState<string | null>(null);
  const qc = useQueryClient();
  const { data: profiles = [] } = useProfiles();
  const { data: students = [] } = useStudents();
  const { data: fees = [] } = useFees(isAdmin);
  const editing = students.find((s) => s.id === editingId);
  const outstanding = fees.filter((f) => f.status === "unpaid").reduce((s, f) => s + Number(f.amount), 0);
  const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
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

  return (
    <>
      {!isAdmin && <h1 className="text-2xl font-extrabold">Head teacher</h1>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[["Students", students.length], ["Portal users", profiles.length], ...(isAdmin ? [["Fees collected", cedi(collected)], ["Outstanding", cedi(outstanding)]] : [["Teachers", profiles.filter((p) => p.roles.includes("teacher")).length]])].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-navy p-5 text-navy-foreground"><p className="text-sm opacity-80">{k}</p><p className="mt-1 text-2xl font-extrabold text-secondary">{v}</p></div>
        ))}
      </div>

      <Card title={isAdmin ? "Users & access" : "Teachers & access"}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Name</th><th>Email</th>{ROLES.map((r) => <th key={r}>{roleLabel(r)}</th>)}</tr></thead>
            <tbody>{profiles.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-2 font-semibold">{p.full_name || "—"}{isAdmin && <button className="ml-2 text-xs font-bold text-primary" onClick={() => renameUser(p.id, p.full_name)} aria-label={`Edit name for ${p.email}`}>Edit</button>}</td><td>{p.email}</td>
                {ROLES.map((r) => { const has = p.roles.includes(r); return (
                  <td key={r}><input type="checkbox" aria-label={`${roleLabel(r)} access for ${p.email}`} checked={has} disabled={!canChangeRole(roles, p.roles, r, p.id === userId)} onChange={() => toggleRole(p.id, r, has)} /></td>
                ); })}
              </tr>))}</tbody>
          </table>
        </div>
      </Card>

      <Card title="Students">
        <form key={editingId ?? "new"} onSubmit={addStudent} className="mb-5 grid gap-3 md:grid-cols-5">
          <input name="name" defaultValue={editing?.full_name} required placeholder="Student full name" className={field} aria-label="Student full name" />
          <input name="class" defaultValue={editing?.class_name} required placeholder="Class e.g. Basic 4" className={field} aria-label="Class" />
          <select name="student_user" defaultValue={editing?.student_user_id ?? ""} className={field} aria-label="Student login"><option value="">Student login (optional)</option>
            {profiles.filter((p) => p.roles.includes("student")).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select>
          <select name="guardian" defaultValue={editing?.guardian_user_id ?? ""} className={field} aria-label="Parent login"><option value="">Parent login (optional)</option>
            {profiles.filter((p) => p.roles.includes("parent")).map((p) => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}</select>
          <Button type="submit">{editingId ? "Save student" : "Add student"}</Button>
          {editingId && <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>}
        </form>
        {students.length === 0 ? <p className="text-muted-foreground">No students yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Name</th><th>Class</th><th>Student login</th><th>Parent</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{students.map((s) => <tr key={s.id} className="border-t"><td className="py-2 font-semibold">{s.full_name}</td><td>{s.class_name}</td><td>{userName(s.student_user_id)}</td><td>{userName(s.guardian_user_id)}</td><td>{s.active ? "Active" : "Inactive"}</td><td className="whitespace-nowrap"><Button variant="link" onClick={() => setEditingId(s.id)} aria-label={`Edit ${s.full_name}`}>Edit</Button><Button variant="link" onClick={() => toggleActive(s.id, s.active)}>{s.active ? "Deactivate" : "Reactivate"}</Button></td></tr>)}</tbody></table></div>
        )}
      </Card>

      {isAdmin && <Card title="Fees & receipts">
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

      <EventsCard />
      {isAdmin && <ReportsCard fees={fees} students={students} userName={userName} />}
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
            <td><span className={f.status === "paid" ? "rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground" : "rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground"}>{f.status === "paid" ? "Paid" : "Unpaid"}</span></td>
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
  const today = new Date().toISOString().slice(0, 10);
  const feeRow = (f: FeeRow) => [f.students?.full_name, f.students?.class_name, f.description, Number(f.amount).toFixed(2), f.status, f.payment_method, f.paid_on, f.receipt_no];
  const feeHead = ["Student", "Class", "Description", "Amount (GHS)", "Status", "Method", "Paid on", "Receipt"];
  async function marks() {
    let q = supabase.from("marks").select("subject, assessment, term, score, max_score, published, students!inner(full_name, class_name)").order("term");
    if (cls) q = q.eq("students.class_name", cls);
    const { data, error } = await q;
    if (error) { toast.error(error.message); return; }
    downloadCsv(`marks-${cls || "all-classes"}-${today}.csv`, ["Student", "Class", "Subject", "Assessment", "Term", "Score", "Out of", "Published"],
      (data ?? []).map((m) => [m.students?.full_name, m.students?.class_name, m.subject, m.assessment, m.term, m.score, m.max_score, m.published ? "Yes" : "No"]));
  }
  return (
    <Card title="Reports">
      <p className="mb-4 text-sm text-muted-foreground">Download spreadsheets that open in Excel or Google Sheets.</p>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => downloadCsv(`fees-payments-${today}.csv`, feeHead, fees.map(feeRow))}>Fees & payments</Button>
        <Button variant="outline" onClick={() => downloadCsv(`unpaid-fees-${today}.csv`, feeHead.slice(0, 5), fees.filter((f) => f.status === "unpaid").map((f) => feeRow(f).slice(0, 5)))}>Unpaid fees</Button>
        <Button variant="outline" onClick={() => downloadCsv(`students-${today}.csv`, ["Name", "Class", "Status", "Student login", "Parent"], students.map((s) => [s.full_name, s.class_name, s.active ? "Active" : "Inactive", userName(s.student_user_id), userName(s.guardian_user_id)]))}>Student list</Button>
        <span className="flex items-center gap-2">
          <select value={cls} onChange={(e) => setCls(e.target.value)} className={field + " !w-auto"} aria-label="Class for marks report"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <Button variant="outline" onClick={marks}>Marks by class</Button>
        </span>
      </div>
    </Card>
  );
}

function TeacherArea() {
  const { data: students = [] } = useStudents();
  return (
    <Card title="Students">
      {students.length === 0 ? <p className="text-muted-foreground">No students yet.</p> : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{students.map((s) => <li key={s.id} className="rounded-xl border p-3"><p className="font-semibold">{s.full_name}</p><p className="text-sm text-muted-foreground">{s.class_name}</p></li>)}</ul>
      )}
    </Card>
  );
}

function FamilyArea() {
  const { data: fees = [] } = useFees();
  const owed = fees.filter((f) => f.status === "unpaid").reduce((s, f) => s + Number(f.amount), 0);
  return (
    <Card title="School fees" action={<span className="rounded-full bg-secondary px-3 py-1 text-sm font-bold">Balance due: {cedi(owed)}</span>}>
      <FeeTable fees={fees} />
    </Card>
  );
}
