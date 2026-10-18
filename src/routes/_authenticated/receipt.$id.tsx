import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { school } from "@/lib/school";
import { cedi } from "@/lib/money";

export const Route = createFileRoute("/_authenticated/receipt/$id")({
  head: () => ({ meta: [{ title: "Fee Receipt | His Grace Academy" }, { name: "robots", content: "noindex" }] }),
  component: Receipt,
});

function Receipt() {
  const { id } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("fees").select("*, students(full_name, class_name)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  if (isLoading) return <p className="p-10">Loading receipt…</p>;
  if (!data || data.status !== "paid") return <p className="p-10">No receipt available — this fee has not been recorded as paid.</p>;
  const rows: [string, string][] = [
    ["Receipt number", data.receipt_no ?? ""],
    ["Student", data.students?.full_name ?? ""],
    ["Class", data.students?.class_name ?? ""],
    ["Description", data.description],
    ["Payment date", data.paid_on ?? ""],
    ["Payment method", data.payment_method ?? ""],
    ["Status", "PAID"],
  ];
  return (
    <div className="min-h-screen bg-muted py-10 print:bg-background print:py-0">
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 print:border-0">
        <div className="flex items-start justify-between border-b-4 border-secondary pb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-primary">{school.name}</h1>
            <p className="text-xs text-muted-foreground">{school.location}<br />{school.phone} · {school.email}</p>
          </div>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-extrabold">OFFICIAL RECEIPT</span>
        </div>
        <dl className="mt-6 divide-y">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between py-2 text-sm"><dt className="text-muted-foreground">{k}</dt><dd className="font-semibold">{v}</dd></div>)}
        </dl>
        <div className="mt-6 flex items-center justify-between rounded-xl bg-navy p-4 text-navy-foreground">
          <span className="font-bold">Amount paid</span><span className="text-2xl font-extrabold text-secondary">{cedi(data.amount)}</span>
        </div>
        <div className="mt-6 flex gap-3 print:hidden">
          <button onClick={() => window.print()} className="btn-primary">Print / Save as PDF</button>
          <Link to="/portal" className="btn-sun">Back to portal</Link>
        </div>
      </div>
    </div>
  );
}
