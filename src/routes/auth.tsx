import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, meta } from "@/components/SiteLayout";

export const Route = createFileRoute("/auth")({
  head: () => meta("Portal Sign In", "Sign in to the His Grace Academy portal for administrators, head teachers, teachers, students and parents."),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const field = "mt-1 w-full rounded-xl border bg-background px-4 py-3";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password") || "");
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/portal" });
      } else if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/portal", data: { full_name: String(f.get("name")) } },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
        setMode("in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <section className="container-page grid place-items-center py-16">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8">
          <span className="eyebrow">School portal</span>
          <h1 className="mt-1 text-3xl font-extrabold">
            {mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Reset password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">For administrators, head teachers, teachers, students and parents. The school office assigns your access after you register.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "up" && <label className="block font-semibold">Full name<input name="name" required className={field} /></label>}
            <label className="block font-semibold">Email<input name="email" type="email" required className={field} /></label>
            {mode !== "forgot" && (
              <div className="font-semibold">
                <label htmlFor="password">Password</label>
                <div className="relative mt-1">
                  <input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    minLength={6}
                    required
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    className="w-full rounded-xl border bg-background py-3 pl-4 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    aria-pressed={showPw}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            <button disabled={busy} className="btn-primary w-full justify-center">{busy ? "Please wait…" : mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</button>
          </form>
          <div className="mt-4 flex justify-between text-sm font-semibold text-primary">
            {mode === "in" ? <button onClick={() => setMode("up")}>Create an account</button> : <button onClick={() => setMode("in")}>Back to sign in</button>}
            {mode === "in" && <button onClick={() => setMode("forgot")}>Forgot password?</button>}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
