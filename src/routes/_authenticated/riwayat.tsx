import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pager, TxGroupedList } from "@/components/TxList";
import { WalletFilter } from "@/components/WalletPicker";
import { useWallets, TX_LABEL, type TxType } from "@/lib/data";
import { pageInfo, useTxPage } from "@/lib/tx";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/riwayat")({
  head: () => ({ meta: [{ title: "Riwayat — NataKas" }, { name: "description", content: "Riwayat transaksi per hari." }, { property: "og:title", content: "Riwayat — NataKas" }, { property: "og:description", content: "Riwayat transaksi per hari." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Riwayat,
});

function Riwayat() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<TxType | "all">("all");
  const [wallet, setWallet] = useState("all");
  const { data, isLoading } = useTxPage(page, { type, wallet });
  const { data: wallets = [] } = useWallets();
  const list = data?.rows ?? [];
  const { pages } = pageInfo(data?.total ?? 0, page);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Riwayat</h1>
      <div className="flex flex-wrap gap-2">
        {(["all", "income", "expense", "transfer"] as const).map((k) => (
          <button key={k} onClick={() => { setType(k); setPage(1); }} className={cn("retro-sm rounded-full px-3 py-1.5 text-sm font-bold", type === k ? "bg-primary" : "bg-card")}>
            {k === "all" ? "Semua" : TX_LABEL[k]}
          </button>
        ))}
      </div>
      <WalletFilter wallets={wallets} value={wallet} onChange={(w) => { setWallet(w); setPage(1); }} />
      {isLoading && <p className="text-muted-foreground">Memuat…</p>}
      {!isLoading && list.length === 0 && <p className="text-muted-foreground">Belum ada transaksi.</p>}
      <TxGroupedList txs={list} />
      <Pager page={page} pages={pages} onChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
    </div>
  );
}
