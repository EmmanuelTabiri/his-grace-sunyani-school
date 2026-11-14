export type FeeMonthInput = {
  amount: number | string;
  status: string;
  paid_on: string | null;
  created_at: string;
};

export type FeeMonth = {
  key: string;
  label: string;
  collected: number;
  outstanding: number;
};

/** Group fee values by their payment month, or creation month while unpaid. */
export function feeCollectionByMonth(fees: FeeMonthInput[], now = new Date(), count = 6): FeeMonth[] {
  const months: FeeMonth[] = Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - count + index + 1, 1));
    return {
      key: date.toISOString().slice(0, 7),
      label: new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(date),
      collected: 0,
      outstanding: 0,
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const fee of fees) {
    const date = fee.status === "paid" ? fee.paid_on ?? fee.created_at : fee.created_at;
    const month = byKey.get(date.slice(0, 7));
    if (!month) continue;
    const amount = Number(fee.amount);
    if (!Number.isFinite(amount)) continue;
    if (fee.status === "paid") month.collected += amount;
    else month.outstanding += amount;
  }
  return months;
}

export function learningStageCount(classes: string[]) {
  const stages = new Set(classes.map((name) => {
    const value = name.trim().toLowerCase();
    if (value.startsWith("creche")) return "Creche";
    if (value.startsWith("kg") || value.startsWith("kindergarten")) return "Kindergarten";
    if (value.startsWith("basic") || value.startsWith("primary")) return "Basic";
    if (value.startsWith("jhs") || value.startsWith("junior high")) return "Junior High";
    return "Other";
  }));
  return stages.size;
}

export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}
