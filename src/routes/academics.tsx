import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHeader, meta } from "@/components/SiteLayout";

export const Route = createFileRoute("/academics")({
  head: () => meta("Academics", "Programmes, grade levels and subjects offered at His Grace Academy."),
  component: Academics,
});

const levels = [
  { t: "Crèche & Nursery", a: "Ages 1–4", s: ["Early literacy", "Numbers", "Rhymes & songs", "Play & creativity"] },
  { t: "Kindergarten", a: "KG 1–2", s: ["Literacy", "Numeracy", "Our World", "Creative Arts"] },
  { t: "Primary", a: "Basic 1–6", s: ["English", "Mathematics", "Science", "Our World Our People", "Ghanaian Language", "Computing", "RME", "Creative Arts"] },
  { t: "Junior High", a: "JHS 1–3", s: ["English", "Mathematics", "Integrated Science", "Social Studies", "Computing", "Career Technology", "French", "Ghanaian Language"] },
];

function Academics() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Academics" title="Learning for life" intro="We follow the Ghana Education Service curriculum, enriched with ICT, reading clubs and BECE preparation." />
      <section className="container-page grid gap-6 py-16 md:grid-cols-2">
        {levels.map((l) => (
          <div key={l.t} className="rounded-2xl border bg-card p-6">
            <p className="eyebrow">{l.a}</p>
            <h2 className="mt-1 text-2xl font-extrabold">{l.t}</h2>
            <div className="mt-4 flex flex-wrap gap-2">{l.s.map((s) => <span key={s} className="rounded-full bg-accent px-3 py-1 text-sm font-semibold">{s}</span>)}</div>
          </div>
        ))}
      </section>
    </SiteLayout>
  );
}
