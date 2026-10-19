import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const field = "w-full rounded-xl border bg-background px-3 py-2";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border bg-card p-6"><h2 className="mb-4 text-xl font-extrabold">{title}</h2>{children}</section>;
}
function Badge({ on, yes, no }: { on: boolean; yes: string; no: string }) {
  return <span className={on ? "rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground" : "rounded-full bg-secondary px-2 py-0.5 text-xs font-bold text-secondary-foreground"}>{on ? yes : no}</span>;
}

function useData() {
  const students = useQuery({ queryKey: ["students"], queryFn: async () => (await supabase.from("students").select("*").order("full_name")).data ?? [] });
  const marks = useQuery({ queryKey: ["marks"], queryFn: async () => (await supabase.from("marks").select("*, students(full_name, class_name)").order("created_at", { ascending: false })).data ?? [] });
  const homework = useQuery({ queryKey: ["homework"], queryFn: async () => (await supabase.from("homework").select("*").order("due_date")).data ?? [] });
  const news = useQuery({ queryKey: ["announcements"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const diary = useQuery({ queryKey: ["diary"], queryFn: async () => (await supabase.from("diary_entries").select("*").order("entry_date", { ascending: false })).data ?? [] });
  return { students: students.data ?? [], marks: marks.data ?? [], homework: homework.data ?? [], news: news.data ?? [], diary: diary.data ?? [] };
}

export function StaffTools({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { students, marks, homework, news, diary } = useData();
  const classes = [...new Set(students.map((s) => s.class_name).filter(Boolean))].sort();
  const [klass, setKlass] = useState("");
  const refresh = () => qc.invalidateQueries();
  const done = (error: { message: string } | null, msg: string, form?: HTMLFormElement) => {
    if (error) toast.error(error.message.includes("marks_score_range") ? "Score must be between 0 and the maximum score." : error.message);
    else { toast.success(msg); form?.reset(); refresh(); }
  };

  async function addMark(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const score = Number(f.get("score")), max = Number(f.get("max") || 100);
    if (Number.isNaN(score) || score < 0 || score > max) { toast.error("Score must be between 0 and the maximum score."); return; }
    const { error } = await supabase.from("marks").insert({
      student_id: String(f.get("student")), subject: String(f.get("subject")), assessment: String(f.get("assessment")),
      term: String(f.get("term")), score, max_score: max, comment: String(f.get("comment") || "") || null,
      published: f.get("publish") === "on", teacher_id: userId,
    });
    done(error, "Mark saved", form);
  }
  async function addHomework(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const { error } = await supabase.from("homework").insert({
      title: String(f.get("title")), instructions: String(f.get("instructions")), subject: String(f.get("subject")),
      class_name: String(f.get("class")), due_date: String(f.get("due")), published: f.get("publish") === "on", teacher_id: userId,
    });
    done(error, "Homework saved", form);
  }
  async function addNews(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const { error } = await supabase.from("announcements").insert({
      title: String(f.get("title")), body: String(f.get("body")), class_name: (f.get("class") as string) || null, author_id: userId,
    });
    done(error, "Announcement posted", form);
  }
  async function addDiary(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const { error } = await supabase.from("diary_entries").upsert({
      class_name: String(f.get("class")), entry_date: String(f.get("date")), topics: String(f.get("topics")), teacher_id: userId,
    }, { onConflict: "class_name,entry_date,teacher_id" });
    done(error, "Diary entry saved", form);
  }
  async function togglePublish(table: "marks" | "homework", id: string, published: boolean) {
    const { error } = await supabase.from(table).update({ published: !published }).eq("id", id);
    done(error, published ? "Moved back to draft" : "Published");
  }
  async function remove(table: "marks" | "homework" | "announcements" | "diary_entries", id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    done(error, "Deleted");
  }

  const classStudents = students.filter((s) => !klass || s.class_name === klass);

  return (
    <>
      <Card title="Daily class diary">
        <p className="mb-4 text-sm text-muted-foreground">Summarise the topics studied each day — parents and students in the class can read it. Saving again for the same class and day updates the entry.</p>
        <form onSubmit={addDiary} className="mb-5 grid gap-3 md:grid-cols-4">
          <select name="class" required className={field} aria-label="Class"><option value="">Class…</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={field} aria-label="Date" />
          <textarea name="topics" required rows={2} placeholder="Topics studied today e.g. Mathematics: fractions; English: comprehension…" className={`${field} md:col-span-2`} aria-label="Topics studied" />
          <button className="btn-primary justify-center md:col-start-4">Save diary entry</button>
        </form>
        {diary.length === 0 ? <p className="text-muted-foreground">No diary entries yet.</p> : (
          <ul className="space-y-2">{diary.map((d) => (
            <li key={d.id} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border p-3">
              <div><p className="font-bold">{d.class_name} <span className="font-normal text-muted-foreground">· {d.entry_date}</span></p>
                <p className="mt-1 whitespace-pre-line text-sm">{d.topics}</p></div>
              {d.teacher_id === userId && <button onClick={() => remove("diary_entries", d.id)} className="text-sm font-bold text-destructive">Delete</button>}
            </li>))}</ul>
        )}
      </Card>
      <Card title="Record marks">
        <form onSubmit={addMark} className="mb-5 grid gap-3 md:grid-cols-4">
          <select value={klass} onChange={(e) => setKlass(e.target.value)} className={field} aria-label="Filter by class"><option value="">All classes</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <select name="student" required className={field} aria-label="Student"><option value="">Student…</option>{classStudents.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.class_name})</option>)}</select>
          <input name="subject" required placeholder="Subject e.g. Mathematics" className={field} aria-label="Subject" />
          <select name="assessment" className={field} aria-label="Assessment type"><option>Class exercise</option><option>Assignment</option><option>Test</option><option>Exam</option></select>
          <select name="term" className={field} aria-label="Term"><option>Term 1</option><option>Term 2</option><option>Term 3</option></select>
          <input name="score" type="number" step="0.5" min="0" required placeholder="Score" className={field} aria-label="Score" />
          <input name="max" type="number" step="0.5" min="1" defaultValue={100} className={field} aria-label="Maximum score" />
          <input name="comment" placeholder="Feedback (optional)" className={field} aria-label="Feedback" />
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="publish" /> Publish to student & parent</label>
          <button className="btn-primary justify-center md:col-start-4">Save mark</button>
        </form>
        {marks.length === 0 ? <p className="text-muted-foreground">No marks recorded yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Student</th><th>Subject</th><th>Assessment</th><th>Term</th><th>Score</th><th>Status</th><th /></tr></thead>
            <tbody>{marks.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="py-2 font-semibold">{m.students?.full_name}</td><td>{m.subject}</td><td>{m.assessment}</td><td>{m.term}</td>
                <td>{Number(m.score)}/{Number(m.max_score)}</td><td><Badge on={m.published} yes="Published" no="Draft" /></td>
                <td className="space-x-3 whitespace-nowrap text-right">{(m.teacher_id === userId) && <>
                  <button onClick={() => togglePublish("marks", m.id, m.published)} className="font-bold text-primary">{m.published ? "Unpublish" : "Publish"}</button>
                  <button onClick={() => remove("marks", m.id)} className="font-bold text-destructive">Delete</button></>}</td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Card>

      <Card title="Homework">
        <form onSubmit={addHomework} className="mb-5 grid gap-3 md:grid-cols-4">
          <input name="title" required placeholder="Title" className={field} aria-label="Homework title" />
          <input name="subject" required placeholder="Subject" className={field} aria-label="Subject" />
          <select name="class" required className={field} aria-label="Class"><option value="">Class…</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <input name="due" type="date" required className={field} aria-label="Due date" />
          <textarea name="instructions" required rows={2} placeholder="Instructions" className={`${field} md:col-span-3`} aria-label="Instructions" />
          <div className="flex flex-col gap-2"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" name="publish" defaultChecked /> Publish now</label><button className="btn-primary justify-center">Save homework</button></div>
        </form>
        {homework.length === 0 ? <p className="text-muted-foreground">No homework yet.</p> : (
          <ul className="space-y-2">{homework.map((h) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3">
              <div><p className="font-bold">{h.title} <span className="font-normal text-muted-foreground">· {h.subject} · {h.class_name}</span></p><p className="text-sm text-muted-foreground">Due {h.due_date}</p></div>
              <div className="flex items-center gap-3 text-sm"><Badge on={h.published} yes="Published" no="Draft" />
                {h.teacher_id === userId && <><button onClick={() => togglePublish("homework", h.id, h.published)} className="font-bold text-primary">{h.published ? "Unpublish" : "Publish"}</button>
                <button onClick={() => remove("homework", h.id)} className="font-bold text-destructive">Delete</button></>}</div>
            </li>))}</ul>
        )}
      </Card>

      <Card title="Announcements">
        <form onSubmit={addNews} className="mb-5 grid gap-3 md:grid-cols-4">
          <input name="title" required placeholder="Title" className={field} aria-label="Announcement title" />
          <select name="class" className={field} aria-label="Audience"><option value="">Whole school</option>{classes.map((c) => <option key={c}>{c}</option>)}</select>
          <textarea name="body" required rows={2} placeholder="Message" className={`${field} md:col-span-2`} aria-label="Message" />
          <button className="btn-primary justify-center md:col-start-4">Post announcement</button>
        </form>
        <NewsList items={news} onDelete={(id) => remove("announcements", id)} userId={userId} />
      </Card>
    </>
  );
}

type News = { id: string; title: string; body: string; class_name: string | null; created_at: string; author_id: string };
function NewsList({ items, onDelete, userId }: { items: News[]; onDelete?: (id: string) => void; userId?: string }) {
  if (items.length === 0) return <p className="text-muted-foreground">No announcements yet.</p>;
  return (
    <ul className="space-y-2">{items.map((n) => (
      <li key={n.id} className="rounded-xl border p-4">
        <div className="flex justify-between gap-2"><p className="font-bold">{n.title}</p>
          {onDelete && n.author_id === userId && <button onClick={() => onDelete(n.id)} className="text-sm font-bold text-destructive">Delete</button>}</div>
        <p className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()} · {n.class_name ?? "Whole school"}</p>
        <p className="mt-1 text-sm">{n.body}</p>
      </li>))}</ul>
  );
}

export function FamilyLearning() {
  const { marks, homework, news, diary } = useData();
  return (
    <>
      <Card title="Daily class diary">
        {diary.length === 0 ? <p className="text-muted-foreground">No diary entries yet.</p> : (
          <ul className="space-y-2">{diary.map((d) => (
            <li key={d.id} className="rounded-xl border p-4">
              <p className="font-bold">{d.class_name} <span className="font-normal text-muted-foreground">· {new Date(d.entry_date + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></p>
              <p className="mt-1 whitespace-pre-line text-sm">{d.topics}</p>
            </li>))}</ul>
        )}
      </Card>
      <Card title="Announcements"><NewsList items={news} /></Card>
      <Card title="Homework">
        {homework.length === 0 ? <p className="text-muted-foreground">No homework right now.</p> : (
          <ul className="space-y-2">{homework.map((h) => (
            <li key={h.id} className="rounded-xl border p-4">
              <p className="font-bold">{h.title} <span className="font-normal text-muted-foreground">· {h.subject} · {h.class_name}</span></p>
              <p className="text-sm font-semibold text-primary">Due {h.due_date}</p>
              <p className="mt-1 whitespace-pre-line text-sm">{h.instructions}</p>
            </li>))}</ul>
        )}
      </Card>
      <Card title="Marks & feedback">
        {marks.length === 0 ? <p className="text-muted-foreground">No marks published yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-2">Student</th><th>Term</th><th>Subject</th><th>Assessment</th><th>Score</th><th>Feedback</th></tr></thead>
            <tbody>{[...marks].sort((a, b) => a.term.localeCompare(b.term) || a.subject.localeCompare(b.subject)).map((m) => (
              <tr key={m.id} className="border-t"><td className="py-2 font-semibold">{m.students?.full_name}</td><td>{m.term}</td><td>{m.subject}</td><td>{m.assessment}</td>
                <td className="font-bold">{Number(m.score)}/{Number(m.max_score)}</td><td className="text-muted-foreground">{m.comment ?? "—"}</td></tr>))}</tbody>
          </table></div>
        )}
      </Card>
    </>
  );
}
