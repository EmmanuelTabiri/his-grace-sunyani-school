import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, meta } from "@/components/SiteLayout";

export const Route = createFileRoute("/reset-password")({
  head: () => meta("Set New Password", "Choose a new password for your His Grace Academy portal account."),
  component: Reset,
});

function Reset() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const password = String(new FormData(e.currentTarget).get("password"));
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/portal" });
  }
  return (
    <SiteLayout>
      <section className="container-page grid place-items-center py-16">
        <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-2xl border bg-card p-8">
          <Crest className="h-16 w-16" />
          <h1 className="text-3xl font-extrabold">Set a new password</h1>
          <label className="block font-semibold">New password<input name="password" type="password" minLength={6} required className="mt-1 w-full rounded-xl border bg-background px-4 py-3" /></label>
          <button disabled={busy} className="btn-primary">Save password</button>
        </form>
      </section>
    </SiteLayout>
  );
}
