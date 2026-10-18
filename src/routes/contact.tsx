import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { SiteLayout, PageHeader, meta } from "@/components/SiteLayout";
import { school } from "@/lib/school";

export const Route = createFileRoute("/contact")({
  head: () => meta("Contact", "Contact His Grace Academy in Penkwase, Sunyani — address, phone, email and enquiry form."),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") || "");
    if (!f.get("name") || !/^\S+@\S+\.\S+$/.test(email) || !f.get("message")) {
      setError("Please fill in your name, a valid email and a message.");
      return;
    }
    setError("");
    setSent(true);
  }
  const field = "mt-1 w-full rounded-xl border bg-card px-4 py-3";
  return (
    <SiteLayout>
      <PageHeader eyebrow="Contact" title="We'd love to hear from you" />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div className="space-y-4">
          {[[MapPin, school.location], [Phone, school.phone], [Mail, school.email], [Clock, school.hours]].map(([I, t], i) => {
            const Icon = I as typeof MapPin;
            return <p key={i} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-secondary"><Icon size={18} /></span>{t as string}</p>;
          })}
          <div className="grid h-64 place-items-center rounded-2xl border-2 border-dashed bg-muted text-muted-foreground">Map coming soon</div>
        </div>
        <div className="rounded-2xl border bg-card p-6">
          {sent ? (
            <div role="status"><h2 className="text-2xl font-extrabold">Thank you!</h2><p className="mt-2 text-muted-foreground">Your message has been noted. Our office will get back to you soon.</p></div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4">
              <h2 className="text-2xl font-extrabold">Send an enquiry</h2>
              <label className="block font-semibold">Full name<input name="name" className={field} /></label>
              <label className="block font-semibold">Email<input name="email" type="email" className={field} /></label>
              <label className="block font-semibold">Phone (optional)<input name="phone" className={field} /></label>
              <label className="block font-semibold">Message<textarea name="message" rows={5} className={field} /></label>
              {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
              <button className="btn-primary">Send message</button>
            </form>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
