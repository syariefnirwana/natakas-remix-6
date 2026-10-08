import { ChevronLeft, ChevronRight } from "lucide-react";
import { TxRow } from "@/components/TxRow";
import type { Tx } from "@/lib/data";
import { groupByDay } from "@/lib/tx";
import { fmtDayLabel, rupiah } from "@/lib/format";

/** Transactions grouped under day headers ("Hari ini", "Kemarin", tanggal). */
export function TxGroupedList({ txs }: { txs: Tx[] }) {
  return (
    <div className="space-y-4">
      {groupByDay(txs).map(([k, items]) => {
        const inc = items.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const exp = items.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        return (
          <section key={k} className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-extrabold">{fmtDayLabel(k)}</h3>
              <span className="num text-xs font-bold">+{rupiah(inc)} / −{rupiah(exp)}</span>
            </div>
            {items.map((t) => <TxRow key={t.id} tx={t} />)}
          </section>
        );
      })}
    </div>
  );
}

export function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  const btn = "retro-sm press flex size-10 items-center justify-center rounded-xl bg-card disabled:opacity-40";
  return (
    <nav aria-label="Halaman" className="flex items-center justify-center gap-3 pt-2">
      <button className={btn} aria-label="Halaman sebelumnya" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft className="size-5" /></button>
      <span className="num text-sm font-bold">Hal {page} / {pages}</span>
      <button className={btn} aria-label="Halaman berikutnya" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight className="size-5" /></button>
    </nav>
  );
}
