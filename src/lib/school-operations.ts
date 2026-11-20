export function feeBalance(amount: number, paid: number) { return Math.max(0, Math.round((amount - paid) * 100) / 100); }
export function attendanceSummary(rows: { status: string }[]) {
  const counts = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const row of rows) if (row.status in counts) counts[row.status as keyof typeof counts]++;
  return { ...counts, total: rows.length, rate: rows.length ? Math.round(100 * (counts.present + counts.late) / rows.length) : null };
}
export function canPublishResult(leader: boolean, status: string) { return leader && status === 'approved'; }
