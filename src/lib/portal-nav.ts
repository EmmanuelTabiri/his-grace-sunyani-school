import type { Role } from "./portal-access";

export type SectionId = "overview" | "students" | "staff" | "classes" | "gradebook" | "marks" | "results" | "homework" | "announcements" | "diary" | "fees" | "reports";
export type Section = { id: SectionId; label: string };

const L: Record<SectionId, string> = {
  overview: "Dashboard", students: "Students", staff: "Staff & accounts", classes: "Classes & subjects", gradebook: "Gradebook",
  marks: "Marks", results: "Results", homework: "Homework", announcements: "Announcements & events", diary: "Class diary",
  fees: "Fees & receipts", reports: "Reports",
};

/** Sections each role may open. Staff never see family pages and families never see staff pages. */
export function portalSections(roles: Role[]): Section[] {
  const admin = roles.includes("admin");
  const leader = admin || roles.includes("head_teacher");
  const teacher = roles.includes("teacher");
  const family = !leader && !teacher && (roles.includes("student") || roles.includes("parent"));
  let ids: SectionId[] = [];
  if (leader) ids = ["overview", "students", "staff", "classes", "gradebook", "marks", "homework", "announcements", "diary", ...(admin ? (["fees", "reports"] as SectionId[]) : [])];
  else if (teacher) ids = ["overview", "classes", "gradebook", "marks", "homework", "announcements", "diary"];
  else if (family) ids = ["overview", "homework", "results", "announcements", "diary", "fees"];
  return ids.map((id) => ({ id, label: L[id] }));
}

/** Ghana school year runs September to July, e.g. "2026/2027". */
export function schoolYear(d = new Date()) {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}/${y + 1}`;
}
