import { signedUrl, type Category, type Tx, type Wallet } from "@/lib/data";
import { fmtDateTime, rupiah } from "@/lib/format";
import { totals } from "@/lib/tx";

type Ctx = { txs: Tx[]; wallets: Wallet[]; cats: Category[]; periodLabel: string; owner: string };

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

const fileName = (label: string, ext: string) => `NataKas-${label.replace(/[^\w-]+/g, "_")}.${ext}`;

export async function exportPdf(c: Ctx) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const imgs = await loadImages(c.txs);
  const doc = new jsPDF();
  const t = totals(c.txs);
  doc.setFontSize(18); doc.text("Laporan NataKas", 14, 18);
  doc.setFontSize(10); doc.text(`${c.owner} · Periode: ${c.periodLabel}`, 14, 25);
  autoTable(doc, { startY: 30, head: [["Ringkasan", "Jumlah"]], body: [["Pemasukan", rupiah(t.income)], ["Pengeluaran", rupiah(t.expense)], ["Selisih", rupiah(t.net)], ["Transfer (tidak dihitung)", rupiah(t.transfer)]] });
  const sections: [string, Tx["type"]][] = [["Pemasukan", "income"], ["Pengeluaran", "expense"], ["Transfer", "transfer"]];
  for (const [label, type] of sections) {
    const list = c.txs.filter((x) => x.type === type);
    if (!list.length) continue;
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(13); doc.text(label, 14, y);
    autoTable(doc, {
      startY: y + 3,
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
  doc.save(fileName(c.periodLabel, "pdf"));
}

export async function exportExcel(c: Ctx) {
  const ExcelJS = (await import("exceljs")).default;
  const imgs = await loadImages(c.txs);
  const wb = new ExcelJS.Workbook();
  const t = totals(c.txs);
  const s = wb.addWorksheet("Ringkasan");
  s.addRows([["Laporan NataKas"], ["Pemilik", c.owner], ["Periode", c.periodLabel], [], ["Pemasukan", t.income], ["Pengeluaran", t.expense], ["Selisih", t.net], ["Transfer (tidak dihitung)", t.transfer]]);
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
