export function cedi(amount: number | string) {
  return "GH₵ " + Number(amount).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
