import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { defaultSchoolSettings, isValidAcademicYear, SCHOOL_TERMS, type SchoolSettingsValues } from "@/lib/school-settings";

const field = "w-full rounded-lg border bg-background px-3 py-2";
const selection = "school_name, location, academic_year, current_term, contact_email, contact_phone";

export function useSchoolSettings(enabled = true) {
  return useQuery({
    queryKey: ["school-settings"],
    enabled,
    queryFn: async (): Promise<SchoolSettingsValues> => {
      const { data, error } = await supabase.from("school_settings").select(selection).eq("id", true).maybeSingle();
      if (error) throw error;
      return data ?? defaultSchoolSettings();
    },
  });
}

export function SchoolSettings() {
  const qc = useQueryClient();
  const { data: settings = defaultSchoolSettings(), isLoading } = useSchoolSettings();
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const academicYear = String(form.get("academic_year")).trim();
    if (!isValidAcademicYear(academicYear)) {
      toast.error("Use consecutive years in the format 2026/2027.");
      return;
    }
    const values: SchoolSettingsValues = {
      school_name: String(form.get("school_name")).trim(),
      location: String(form.get("location")).trim(),
      academic_year: academicYear,
      current_term: String(form.get("current_term")),
      contact_email: String(form.get("contact_email")).trim() || null,
      contact_phone: String(form.get("contact_phone")).trim() || null,
    };
    setSaving(true);
    const { data, error } = await supabase.from("school_settings").upsert(
      { id: true, ...values, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    ).select(selection).single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    qc.setQueryData(["school-settings"], data);
    toast.success("School settings saved");
  }

  return (
    <>
      <section className="portal-panel">
        <div className="portal-panel-head"><div><h2>School profile</h2><p>These details appear in the portal and family communications.</p></div></div>
        <div className="portal-panel-body">
          {isLoading ? <p className="portal-empty">Loading school settings…</p> : (
            <form key={JSON.stringify(settings)} onSubmit={save} className="portal-form-grid">
              <label className="portal-field"><span>School name</span><input name="school_name" defaultValue={settings.school_name} required minLength={2} maxLength={160} className={field} /></label>
              <label className="portal-field"><span>Location</span><input name="location" defaultValue={settings.location} required minLength={2} maxLength={200} className={field} /></label>
              <label className="portal-field"><span>Academic year</span><input name="academic_year" defaultValue={settings.academic_year} required placeholder="2026/2027" inputMode="numeric" className={field} aria-label="Academic year" aria-describedby="academic-year-help" /><small id="academic-year-help" className="text-[10px] text-muted-foreground">Use consecutive years, for example 2026/2027.</small></label>
              <label className="portal-field"><span>Current term</span><select name="current_term" defaultValue={settings.current_term} className={field} aria-label="Current term">{SCHOOL_TERMS.map((term) => <option key={term}>{term}</option>)}</select></label>
              <label className="portal-field"><span>Contact email</span><input name="contact_email" type="email" defaultValue={settings.contact_email ?? ""} maxLength={254} placeholder="School email address" className={field} /></label>
              <label className="portal-field"><span>Contact phone</span><input name="contact_phone" type="tel" defaultValue={settings.contact_phone ?? ""} maxLength={40} placeholder="School phone number" className={field} /></label>
              <div className="portal-form-actions portal-field-full"><button className="btn-primary" disabled={saving || isLoading}>{saving ? "Saving…" : "Save settings"}</button></div>
            </form>
          )}
        </div>
      </section>
      <div className="portal-notice"><b>Administrator access:</b> Only administrators can change these details. Academic year and current term are shown throughout the portal.</div>
    </>
  );
}
