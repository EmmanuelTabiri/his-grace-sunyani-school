export type Cell = string | number | null | undefined;

export function toCsv(headers: string[], rows: Cell[][]) {
  const esc = (v: Cell) => {
    let s = v == null ? "" : String(v);
    // Neutralize spreadsheet formulas (CSV injection).
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, headers: string[], rows: Cell[][]) {
  const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
