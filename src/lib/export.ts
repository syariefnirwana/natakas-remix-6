import { signedUrl, type Category, type Tx, type Wallet } from "@/lib/data";
import { fmtDateTime, jakartaParts, rupiah } from "@/lib/format";
import { totals } from "@/lib/tx";

type Ctx = { txs: Tx[]; wallets: (Wallet & { balance?: number })[]; cats: Category[]; periodLabel: string; owner: string };

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const b = await (await fetch(url)).blob();
    return await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(b); });
  } catch { return null; }
}

async function loadImages(txs: Tx[]) {
  const map = new Map<string, string>();
  await Promise.all(txs.filter((t) => t.receipt_path).map(async (t) => {
    const u = await signedUrl("receipts", t.receipt_path!, 600);
    const d = u ? await toDataUrl(u) : null;
    if (d) map.set(t.id, d);
  }));
  return map;
}

function rowOf(t: Tx, c: Ctx) {
  const w = c.wallets.find((x) => x.id === t.wallet_id)?.name ?? "";
  const to = c.wallets.find((x) => x.id === t.to_wallet_id)?.name ?? "";
  const cat = c.cats.find((x) => x.id === t.category_id)?.name ?? "";
  return { time: fmtDateTime(t.occurred_at), wallet: t.type === "transfer" ? `${w} → ${to}` : w, cat, note: t.note ?? "", amount: Number(t.amount) };
}

const p2 = (n: number) => String(n).padStart(2, "0");
/** `Laporan [Periode] keuangan by NataKas [dd-MM-yyyy HH-mm-ss].ext` (Jakarta time, OS-safe) */
export function reportFileName(label: string, ext: string, at = new Date()) {
  const j = jakartaParts(at);
  const safe = label.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();
  return `Laporan ${safe} keuangan by NataKas ${p2(j.day)}-${p2(j.month)}-${j.year} ${p2(j.hour)}-${p2(j.minute)}-${p2(j.second)}.${ext}`;
}
const fileName = (label: string, ext: string) => reportFileName(label, ext);

export const TYPE_RGB: Record<Tx["type"], [number, number, number]> = { income: [22, 163, 74], expense: [220, 38, 38], transfer: [37, 99, 235] };

export function walletSummary(wallets: Ctx["wallets"]) {
  const rows = wallets.map((w) => ({ name: w.name, type: w.type, balance: Number(w.balance ?? w.initial_balance) }));
  return { rows, total: rows.reduce((a, r) => a + r.balance, 0) };
}

export async function exportPdf(c: Ctx) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const imgs = await loadImages(c.txs);
  const doc = new jsPDF();
  const t = totals(c.txs);
  doc.setFontSize(18); doc.text("Laporan NataKas", 14, 18);
  doc.setFontSize(10); doc.text(`${c.owner} · Periode: ${c.periodLabel}`, 14, 25);
  autoTable(doc, { startY: 30, head: [["Ringkasan", "Jumlah"]], body: [["Pemasukan", rupiah(t.income)], ["Pengeluaran", rupiah(t.expense)], ["Selisih", rupiah(t.net)], ["Transfer (tidak dihitung)", rupiah(t.transfer)]],
    didParseCell: (d) => { if (d.section === "body") { const k = (["income", "expense", null, "transfer"] as const)[d.row.index]; if (k) d.cell.styles.textColor = TYPE_RGB[k]; } } });
  const ws = walletSummary(c.wallets);
  autoTable(doc, {
    startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6,
    head: [["Dompet / Bank / E-wallet", "Saldo saat ini"]],
    body: [...ws.rows.map((r) => [r.name, rupiah(r.balance)]), ["Total saldo", rupiah(ws.total)]],
    didParseCell: (d) => { if (d.section === "body" && d.row.index === ws.rows.length) d.cell.styles.fontStyle = "bold"; },
  });
  const sections: [string, Tx["type"]][] = [["Pemasukan", "income"], ["Pengeluaran", "expense"], ["Transfer", "transfer"]];
  for (const [label, type] of sections) {
    const list = c.txs.filter((x) => x.type === type);
    if (!list.length) continue;
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(13); doc.setTextColor(...TYPE_RGB[type]); doc.text(label, 14, y); doc.setTextColor(0, 0, 0);
    autoTable(doc, {
      startY: y + 3,
      headStyles: { fillColor: TYPE_RGB[type] },
      didParseCell: (d) => { if (d.section === "body" && d.column.index === 4) d.cell.styles.textColor = TYPE_RGB[type]; },
      head: [["Waktu", type === "transfer" ? "Dompet" : "Dompet", "Kategori", "Rincian", "Nominal", "Bukti"]],
      body: list.map((x) => { const r = rowOf(x, c); return [r.time, r.wallet, r.cat, r.note, rupiah(r.amount), imgs.has(x.id) ? "" : "-"]; }),
      columnStyles: { 5: { cellWidth: 22, minCellHeight: imgs.size ? 20 : 0 } },
      didDrawCell: (d) => {
        if (d.section === "body" && d.column.index === 5) {
          const img = imgs.get(list[d.row.index]!.id);
          if (img) doc.addImage(img, "JPEG", d.cell.x + 1, d.cell.y + 1, 20, 18);
        }
      },
    });
  }
  const pages = doc.getNumberOfPages();
  const GState = (doc as unknown as { GState: new (o: { opacity: number }) => unknown }).GState;
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight();
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.1 }) as never);
    doc.setFontSize(46); doc.setTextColor(120, 120, 120);
    doc.text("Protected by NataKas", w / 2, h / 2, { align: "center", angle: 35 });
    doc.restoreGraphicsState();
    doc.setTextColor(0, 0, 0);
  }
  doc.save(fileName(c.periodLabel, "pdf"));
}

export async function exportExcel(c: Ctx) {
  const ExcelJS = (await import("exceljs")).default;
  const imgs = await loadImages(c.txs);
  const wb = new ExcelJS.Workbook();
  const t = totals(c.txs);
  const s = wb.addWorksheet("Ringkasan");
  s.addRows([["Laporan NataKas"], ["Pemilik", c.owner], ["Periode", c.periodLabel], [], ["Pemasukan", t.income], ["Pengeluaran", t.expense], ["Selisih", t.net], ["Transfer (tidak dihitung)", t.transfer], [], ["Saldo dompet"], ...walletSummary(c.wallets).rows.map((r) => [r.name, r.balance]), ["Total saldo", walletSummary(c.wallets).total]]);
  s.getColumn(1).width = 28; s.getColumn(2).width = 20; s.getColumn(2).numFmt = '"Rp"#,##0';
  for (const [label, type] of [["Pemasukan", "income"], ["Pengeluaran", "expense"], ["Transfer", "transfer"]] as const) {
    const list = c.txs.filter((x) => x.type === type);
    const ws = wb.addWorksheet(label);
    ws.columns = [{ header: "Waktu", width: 26 }, { header: "Dompet", width: 22 }, { header: "Kategori", width: 18 }, { header: "Rincian", width: 30 }, { header: "Nominal", width: 16, style: { numFmt: '"Rp"#,##0' } }, { header: "Bukti", width: 18 }];
    ws.getRow(1).font = { bold: true };
    list.forEach((x, i) => {
      const r = rowOf(x, c);
      const row = ws.addRow([r.time, r.wallet, r.cat, r.note, r.amount, ""]);
      const img = imgs.get(x.id);
      if (img) {
        row.height = 80;
        const id = wb.addImage({ base64: img, extension: "jpeg" });
        ws.addImage(id, { tl: { col: 5, row: i + 1 }, ext: { width: 100, height: 100 } });
      }
    });
  }
  const buf = await wb.xlsx.writeBuffer();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  a.download = fileName(c.periodLabel, "xlsx");
  a.click();
}
