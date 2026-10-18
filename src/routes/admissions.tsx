import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHeader, meta } from "@/components/SiteLayout";

export const Route = createFileRoute("/admissions")({
  head: () => meta("Admissions", "How to apply to His Grace Academy: process, requirements and key dates."),
  component: Admissions,
});

const steps = ["Visit or contact the school office", "Collect and complete the admission form", "Child sits a short placement assessment", "Meet the headteacher", "Pay admission fees and receive your welcome pack"];
const reqs = ["Birth certificate (copy)", "Two passport photographs", "Previous school report (if any)", "Child health / immunisation record", "Parent or guardian Ghana Card (copy)"];
const dates = [["Applications open", "Jan 6, 2027"], ["Placement assessments", "Every Saturday in March"], ["Term 1 begins", "Sep 8, 2027"]];

function Admissions() {
  return (
    <SiteLayout>
      <PageHeader eyebrow="Admissions" title="Join the His Grace family" intro="We welcome learners from Crèche to Junior High School." />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div><h2 className="text-2xl font-extrabold">Admission process</h2>
          <ol className="mt-5 space-y-3">{steps.map((s, i) => (
            <li key={s} className="flex items-center gap-4 rounded-xl border bg-card p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-extrabold">{i + 1}</span>{s}</li>))}</ol></div>
        <div className="space-y-10">
          <div><h2 className="text-2xl font-extrabold">Requirements</h2>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-muted-foreground">{reqs.map((r) => <li key={r}>{r}</li>)}</ul></div>
          <div><h2 className="text-2xl font-extrabold">Important dates</h2>
            <dl className="mt-4 divide-y rounded-xl border bg-card">{dates.map(([k, v]) => <div key={k} className="flex justify-between p-4"><dt>{k}</dt><dd className="font-bold">{v}</dd></div>)}</dl></div>
          <Link to="/contact" className="btn-primary">Make an enquiry</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
