import type { Database } from "@/integrations/supabase/types";
import { schoolYear } from "./portal-nav";

export type SchoolSettingsValues = Pick<
  Database["public"]["Tables"]["school_settings"]["Row"],
  "school_name" | "location" | "academic_year" | "current_term" | "contact_email" | "contact_phone"
>;

export const SCHOOL_TERMS = ["Term 1", "Term 2", "Term 3"] as const;

export function defaultSchoolSettings(): SchoolSettingsValues {
  return {
    school_name: "His Grace Academy",
    location: "Penkwase, Sunyani, Ghana",
    academic_year: schoolYear(),
    current_term: "Term 1",
    contact_email: null,
    contact_phone: null,
  };
}

/** Academic years use consecutive calendar years, for example 2026/2027. */
export function isValidAcademicYear(value: string) {
  const match = /^(\d{4})\/(\d{4})$/.exec(value.trim());
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
}
