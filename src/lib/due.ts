export type DueTone = "overdue" | "soon" | "later";

/** Homework due within 3 days (today included) counts as "due soon". */
export function dueStatus(dueDate: string, today = new Date().toISOString().slice(0, 10)): { label: string; tone: DueTone } {
  const days = Math.round((Date.parse(dueDate) - Date.parse(today)) / 86_400_000);
  if (days < 0) return { label: "Overdue", tone: "overdue" };
  if (days === 0) return { label: "Due today", tone: "soon" };
  if (days === 1) return { label: "Due tomorrow", tone: "soon" };
  if (days <= 3) return { label: `Due in ${days} days`, tone: "soon" };
  return { label: `Due in ${days} days`, tone: "later" };
}
