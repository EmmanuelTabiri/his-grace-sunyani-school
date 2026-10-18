import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader, meta } from "@/components/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => meta("About Us", "History, mission, vision, values, leadership and facilities of His Grace Academy, Sunyani."),
  component: About,
});

const values = ["Faith", "Integrity", "Respect", "Excellence", "Service"];
const leaders = [
  { n: "Headteacher", r: "Leads academics and school life" },
  { n: "Assistant Head", r: "Oversees discipline and welfare" },
  { n: "Bursar", r: "Manages fees and finance" },
];
const facilities = ["Spacious classrooms", "ICT laboratory", "Science lab", "Library", "Sports field", "School bus service"];

function About() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="About us" title="Rooted in grace, reaching for excellence" intro="His Grace Academy serves families in Penkwase and across Sunyani with quality, caring education." />
      <section className="container-page grid gap-8 py-16 md:grid-cols-3">
        {[["Our history", "Founded to give children in Penkwase access to excellent education, the academy has grown from a few classrooms into a thriving community."],
          ["Our mission", "To provide holistic, quality education that develops the mind, character and spirit of every learner."],
          ["Our vision", "To raise confident, God-fearing leaders who make a positive difference in Ghana and the world."]].map(([t, d]) => (
          <div key={t} className="rounded-2xl border bg-card p-6"><h2 className="text-xl font-extrabold">{t}</h2><p className="mt-2 text-muted-foreground">{d}</p></div>
        ))}
      </section>
      <section className="bg-accent"><div className="container-page py-12">
        <h2 className="text-2xl font-extrabold">Our values</h2>
        <div className="mt-4 flex flex-wrap gap-3">{values.map((v) => <span key={v} className="rounded-full bg-primary px-5 py-2 font-bold text-primary-foreground">{v}</span>)}</div>
      </div></section>
      <section className="container-page grid gap-10 py-16 md:grid-cols-2">
        <div><h2 className="text-2xl font-extrabold">Leadership</h2>
          <ul className="mt-4 space-y-3">{leaders.map((l) => <li key={l.n} className="rounded-xl border bg-card p-4"><p className="font-bold">{l.n}</p><p className="text-sm text-muted-foreground">{l.r}</p></li>)}</ul></div>
        <div><h2 className="text-2xl font-extrabold">Facilities</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3">{facilities.map((f) => <li key={f} className="rounded-xl bg-secondary p-4 font-semibold text-secondary-foreground">{f}</li>)}</ul></div>
      </section>
    </SiteLayout>
  );
}
