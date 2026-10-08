import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCategories, useFlags, useProfile, useWallets } from "@/lib/data";
import { dayRange, totals, useTransactions, weeksOfMonth } from "@/lib/tx";
import { daysInMonth, errMsg, fromJakarta, jakartaParts, MONTHS, rupiah, dayKey } from "@/lib/format";
import { exportExcel, exportPdf } from "@/lib/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/laporan")({
  head: () => ({ meta: [{ title: "Laporan — NataKas" }, { name: "description", content: "Laporan keuangan dan ekspor PDF/Excel." }, { property: "og:title", content: "Laporan — NataKas" }, { property: "og:description", content: "Laporan keuangan dan ekspor PDF/Excel." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Laporan,
});

type Mode = "daily" | "weekly" | "monthly" | "yearly" | "all" | "custom";
const MODES: [Mode, string][] = [["daily", "Harian"], ["weekly", "Mingguan"], ["monthly", "Bulanan"], ["yearly", "Tahunan"], ["all", "Semua"], ["custom", "Custom"]];

function Laporan() {
  const now = jakartaParts(new Date());
  const [mode, setMode] = useState<Mode>("monthly");
  const [y, setY] = useState(now.year);
  const [m, setM] = useState(now.month);
  const [d, setD] = useState(now.day);
  const [week, setWeek] = useState(0);
  const [customKind, setCustomKind] = useState<"days" | "weeks">("days");
  const [pickDays, setPickDays] = useState<number[]>([]);
  const [pickWeeks, setPickWeeks] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const { data: flags = {} } = useFlags();
  const weeks = weeksOfMonth(y, m);

  const { range, label, allowedDays } = useMemo(() => {
    const ml = `${MONTHS[m - 1]} ${y}`;
    switch (mode) {
      case "daily": return { range: dayRange(y, m, d), label: `${d} ${ml}`, allowedDays: null };
      case "weekly": {
        const w = weeks[Math.min(week, weeks.length - 1)]!;
        return { range: { from: fromJakarta(y, m, w[0]!), to: dayRange(y, m, w[w.length - 1]!).to }, label: `Minggu ke-${week + 1} ${ml}`, allowedDays: null };
      }
      case "monthly": return { range: { from: fromJakarta(y, m, 1), to: dayRange(y, m, daysInMonth(y, m)).to }, label: ml, allowedDays: null };
      case "yearly": return { range: { from: fromJakarta(y, 1, 1), to: fromJakarta(y + 1, 1, 1) }, label: String(y), allowedDays: null };
      case "all": return { range: undefined, label: "Semua riwayat", allowedDays: null };
      case "custom": {
        const days = customKind === "days" ? pickDays : pickWeeks.flatMap((i) => weeks[i] ?? []);
        const lbl = customKind === "days" ? `Tgl ${[...pickDays].sort((a, b) => a - b).join(",")} ${ml}` : `Minggu ke-${[...pickWeeks].sort().map((i) => i + 1).join(",")} ${ml}`;
        return { range: { from: fromJakarta(y, m, 1), to: dayRange(y, m, daysInMonth(y, m)).to }, label: lbl, allowedDays: new Set(days) };
      }
    }
  }, [mode, y, m, d, week, weeks, customKind, pickDays, pickWeeks]);

  const { data: raw = [], isLoading } = useTransactions(range, 5000);
  const txs = allowedDays ? raw.filter((t) => allowedDays.has(Number(dayKey(t.occurred_at).slice(8)))) : raw;
  const { data: wallets = [] } = useWallets();
  const { data: cats = [] } = useCategories();
  const { data: profile } = useProfile();
  const t = totals(txs);

  const byCat = new Map<string, number>();
  txs.filter((x) => x.type === "expense").forEach((x) => {
    const n = cats.find((c) => c.id === x.category_id)?.name ?? "Tanpa kategori";
    byCat.set(n, (byCat.get(n) ?? 0) + Number(x.amount));
  });
  const catList = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

  if (flags.reports === false) return <div className="retro rounded-2xl bg-card p-6 font-bold">Fitur laporan sedang dinonaktifkan oleh admin.</div>;

  const run = async (fmt: "pdf" | "xlsx") => {
    if (mode === "custom" && !allowedDays?.size) return toast.error("Pilih tanggal atau minggu dulu");
    setBusy(true);
    try {
      const ctx = { txs, wallets, cats, periodLabel: label, owner: profile?.display_name ?? profile?.email ?? "" };
      await (fmt === "pdf" ? exportPdf(ctx) : exportExcel(ctx));
      toast.success("Laporan siap diunduh");
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const chip = (on: boolean) => cn("retro-sm rounded-full px-3 py-1.5 text-sm font-bold", on ? "bg-primary" : "bg-card");
  const sel = "retro-sm rounded-xl bg-paper px-3 py-2 font-semibold";
  const toggle = (arr: number[], v: number) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Laporan</h1>
      <div className="flex flex-wrap gap-2">{MODES.map(([k, l]) => <button key={k} className={chip(mode === k)} onClick={() => setMode(k)}>{l}</button>)}</div>

      {mode !== "all" && (
        <div className="flex flex-wrap gap-2">
          {mode === "daily" && <select className={sel} value={d} onChange={(e) => setD(+e.target.value)}>{Array.from({ length: daysInMonth(y, m) }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>}
          {mode !== "yearly" && <select className={sel} value={m} onChange={(e) => { setM(+e.target.value); setPickDays([]); setPickWeeks([]); setWeek(0); }}>{MONTHS.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</select>}
          <select className={sel} value={y} onChange={(e) => setY(+e.target.value)}>{Array.from({ length: 8 }, (_, i) => now.year - 6 + i).map((v) => <option key={v}>{v}</option>)}</select>
          {mode === "weekly" && <select className={sel} value={week} onChange={(e) => setWeek(+e.target.value)}>{weeks.map((w, i) => <option key={i} value={i}>Minggu ke-{i + 1} ({w[0]}–{w[w.length - 1]})</option>)}</select>}
        </div>
      )}

      {mode === "custom" && (
        <div className="retro space-y-3 rounded-2xl bg-card p-4">
          <div className="flex gap-2"><button className={chip(customKind === "days")} onClick={() => setCustomKind("days")}>Pilih tanggal</button><button className={chip(customKind === "weeks")} onClick={() => setCustomKind("weeks")}>Pilih minggu</button></div>
          {customKind === "days" ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1).map((v) => <button key={v} onClick={() => setPickDays(toggle(pickDays, v))} className={cn("num rounded-lg border-2 border-ink py-1.5 text-sm font-bold", pickDays.includes(v) ? "bg-primary" : "bg-paper")}>{v}</button>)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">{weeks.map((w, i) => <button key={i} className={chip(pickWeeks.includes(i))} onClick={() => setPickWeeks(toggle(pickWeeks, i))}>Minggu ke-{i + 1} ({w[0]}–{w[w.length - 1]})</button>)}</div>
          )}
          <p className="text-xs text-muted-foreground">Minggu dihitung Senin–Minggu; minggu pertama memuat tanggal 1.</p>
        </div>
      )}

      <section className="retro rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">{label}</h2>
        {isLoading ? <p className="text-sm">Memuat…</p> : (
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Pemasukan" v={t.income} cls="bg-income/40" />
            <Stat label="Pengeluaran" v={t.expense} cls="bg-expense/40" />
            <Stat label="Selisih" v={t.net} cls="bg-primary/40" />
            <Stat label="Transfer" v={t.transfer} cls="bg-transfer/40" />
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{txs.length} transaksi · {txs.filter((x) => x.receipt_path).length} foto bukti</p>
      </section>

      {catList.length > 0 && (
        <section className="retro space-y-2 rounded-2xl bg-card p-4">
          <h2 className="font-extrabold">Pengeluaran per kategori</h2>
          {catList.map(([n, v]) => (
            <div key={n}>
              <div className="flex justify-between text-sm font-bold"><span>{n}</span><span className="num">{rupiah(v)}</span></div>
              <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-expense" style={{ width: `${(v / t.expense) * 100}%` }} /></div>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" disabled={busy || !txs.length} onClick={() => run("pdf")}>Ekspor PDF</Button>
        <Button size="lg" variant="outline" disabled={busy || !txs.length} onClick={() => run("xlsx")}>Ekspor Excel</Button>
      </div>
      {busy && <p className="text-center text-sm text-muted-foreground">Menyiapkan file beserta foto bukti…</p>}
    </div>
  );
}

function Stat({ label, v, cls }: { label: string; v: number; cls: string }) {
  return <div className={cn("rounded-xl p-3", cls)}><div className="text-xs font-bold">{label}</div><div className="num font-bold">{rupiah(v)}</div></div>;
}
