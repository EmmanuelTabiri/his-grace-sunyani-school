import type { Cell } from "./reports";

export function reportStamp(d = new Date()) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function reportFilename(title: string, d = new Date()) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug}-${d.toISOString().slice(0, 10)}.pdf`;
}

export async function downloadPdfReport(title: string, headers: string[], rows: Cell[][]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const now = new Date();
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30, 42, 90);
  doc.text("His Grace Academy, Penkwase, Sunyani", 40, 44);
  doc.setFontSize(18); doc.setTextColor(20, 20, 20);
  doc.text(title, 40, 70);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 90, 90);
  doc.text(`Generated on ${reportStamp(now)}  ·  ${rows.length} record${rows.length === 1 ? "" : "s"}`, 40, 88);
  autoTable(doc, {
    startY: 102,
    head: [headers],
    body: rows.length ? rows.map((r) => r.map((c) => (c == null ? "" : String(c)))) : [[{ content: "No records", colSpan: headers.length }]],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 42, 90], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 245, 232] },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`${title} · Page ${doc.getNumberOfPages()}`, 40, h - 20);
    },
  });
  doc.save(reportFilename(title, now));
}
