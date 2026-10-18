import type { Database } from "@/integrations/supabase/types";

export type Role = Database["public"]["Enums"]["app_role"];
export const ROLES: Role[] = ["admin", "head_teacher", "teacher", "student", "parent"];
export const roleLabel = (role: Role) => role === "head_teacher" ? "Head teacher" : role.charAt(0).toUpperCase() + role.slice(1);
export function canChangeRole(actor: Role[], target: Role[], role: Role, self: boolean) {
  if (actor.includes("admin")) return true;
  return actor.includes("head_teacher") && role === "teacher" && !self && !target.includes("admin") && !target.includes("head_teacher");
}