import type { Cell } from "./reports";
import logo from "@/assets/school-logo.png.asset.json";

export function reportStamp(d = new Date()) {
  return d.toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function reportFilename(title: string, d = new Date()) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug}-${d.toISOString().slice(0, 10)}.pdf`;
}

async function loadLogo(): Promise<string | null> {
  try {
    const blob = await (await fetch(logo.url)).blob();
    return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => res(null); r.readAsDataURL(blob); });
  } catch { return null; }
}

export async function downloadPdfReport(title: string, headers: string[], rows: Cell[][]) {
  const [{ jsPDF }, { default: autoTable }, logoData] = await Promise.all([import("jspdf"), import("jspdf-autotable"), loadLogo()]);
  const now = new Date();
  const doc = new jsPDF({ orientation: headers.length > 5 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  // Navy header band with gold rule
  doc.setFillColor(30, 42, 90); doc.rect(0, 0, w, 96, "F");
  doc.setFillColor(214, 168, 40); doc.rect(0, 96, w, 5, "F");
  if (logoData) { doc.setFillColor(255, 255, 255); doc.circle(70, 48, 34, "F"); doc.addImage(logoData, "PNG", 42, 20, 56, 56); }
  doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(20);
  doc.text("HIS GRACE ACADEMY", 118, 44);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(240, 220, 160);
  doc.text("Penkwase, Sunyani, Ghana", 118, 62);
  // Report title
  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(30, 42, 90);
  doc.text(title.toUpperCase(), w / 2, 136, { align: "center" });
  doc.setDrawColor(214, 168, 40); doc.setLineWidth(2); doc.line(w / 2 - 60, 146, w / 2 + 60, 146);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(90, 90, 90);
  doc.text(`Generated on ${reportStamp(now)}  ·  ${rows.length} record${rows.length === 1 ? "" : "s"}`, w / 2, 164, { align: "center" });
  autoTable(doc, {
    startY: 180,
    head: [headers],
    body: rows.length ? rows.map((r) => r.map((c) => (c == null ? "" : String(c)))) : [[{ content: "No records", colSpan: headers.length }]],
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 42, 90], textColor: 255 },
    alternateRowStyles: { fillColor: [248, 245, 232] },
    margin: { left: 40, right: 40 },
    didDrawPage: () => {
      const h = doc.internal.pageSize.getHeight();
      doc.setFontSize(8); doc.setTextColor(120);
      doc.text(`His Grace Academy · ${title} · Page ${doc.getNumberOfPages()}`, 40, h - 20);
    },
  });
  doc.save(reportFilename(title, now));
}
