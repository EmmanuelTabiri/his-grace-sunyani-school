import type { Role } from "./portal-access";

export type SectionId = "attendance" | "family" | "review" | "calendar" | "overview" | "students" | "staff" | "classes" | "gradebook" | "marks" | "results" | "homework" | "announcements" | "diary" | "fees" | "reports" | "settings";
export type Section = { id: SectionId; label: string };

const L: Record<SectionId, string> = {
  attendance: "Attendance", family: "Student & family", review: "Results review", calendar: "School calendar", overview: "Overview", students: "Students", staff: "Staff & accounts", classes: "Classes & subjects", gradebook: "Gradebook",
  marks: "Marks", results: "Results", homework: "Homework", announcements: "Announcements & events", diary: "Class diary",
  fees: "Fees & receipts", reports: "Reports", settings: "School settings",
};

/** Sections each role may open. Staff never see family pages and families never see staff pages. */
export function portalSections(roles: Role[]): Section[] {
  const admin = roles.includes("admin");
  const leader = admin || roles.includes("head_teacher");
  const teacher = roles.includes("teacher");
  const family = !leader && !teacher && (roles.includes("student") || roles.includes("parent"));
  let ids: SectionId[] = [];
  if (leader) ids = ["overview", "attendance", "review", "calendar", "students", "staff", "classes", "gradebook", "marks", "homework", "announcements", "diary", ...(admin ? (["fees", "reports", "settings"] as SectionId[]) : [])];
  else if (teacher) ids = ["overview", "attendance", "review", "calendar", "classes", "gradebook", "marks", "homework", "announcements", "diary"];
  else if (family) ids = ["overview", "attendance", "family", "calendar", "homework", "results", "announcements", "diary", "fees"];
  return ids.map((id) => ({ id, label: L[id] }));
}

/** Ghana school year runs September to July, e.g. "2026/2027". */
export function schoolYear(d = new Date()) {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}/${y + 1}`;
}
