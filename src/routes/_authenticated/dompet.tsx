import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keypad } from "@/components/Keypad";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { BANK_TEMPLATES, EWALLET_TEMPLATES, WALLET_TYPE_ICON, WALLET_TYPE_LABEL, useWallets, type WalletType, type WalletWithBalance } from "@/lib/data";
import { useInvalidateMoney } from "@/lib/tx";
import { errMsg, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dompet")({
  head: () => ({ meta: [{ title: "Dompet — NataKas" }, { name: "description", content: "Kelola dompet cash, bank, e-wallet, dan custom." }, { property: "og:title", content: "Dompet — NataKas" }, { property: "og:description", content: "Kelola dompet cash, bank, e-wallet, dan custom." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: DompetPage,
});

const TYPES: WalletType[] = ["cash", "bank", "ewallet", "custom"];

function DompetPage() {
  const { data: wallets = [], isLoading } = useWallets();
  const [edit, setEdit] = useState<WalletWithBalance | "new" | null>(null);
  const [deleting, setDeleting] = useState<WalletWithBalance | null>(null);
  const invalidate = useInvalidateMoney();

  const remove = async (w: WalletWithBalance) => {
    if (w.txCount > 0) return toast.error("Dompet ini sudah punya transaksi, tidak bisa dihapus.");
    const { error } = await supabase.from("wallets").delete().eq("id", w.id);
    if (error) throw error;
    invalidate();
    toast.success("Dompet dihapus");
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold">Dompet</h1>
        <Button onClick={() => setEdit("new")}><Plus className="size-4" /> Tambah</Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Memuat…</p>}
      {TYPES.map((t) => {
        const list = wallets.filter((w) => w.type === t);
        if (!list.length) return null;
        return (
          <section key={t} className="space-y-2">
            <h2 className="flex min-w-0 flex-wrap items-center gap-x-2 font-extrabold">{(() => { const I = WALLET_TYPE_ICON[t]; return <I className="size-5 shrink-0" />; })()} {WALLET_TYPE_LABEL[t]} · <span className="num break-all">{rupiah(list.reduce((s, w) => s + w.balance, 0))}</span></h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((w) => (
                <div key={w.id} className="retro flex min-w-0 items-start gap-3 rounded-2xl bg-card p-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{w.name}</div>
                    <div className="num break-words text-lg font-bold leading-tight sm:text-xl">{rupiah(w.balance)}</div>
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{w.txCount} transaksi · saldo awal {rupiah(Number(w.initial_balance))}</div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1 min-[380px]:flex-row">
                    <button aria-label={`Ubah ${w.name}`} onClick={() => setEdit(w)} className="retro-sm press rounded-lg bg-paper p-2"><Pencil className="size-4" /></button>
                    <Button size="icon" variant="secondary" aria-label={`Hapus ${w.name}`} onClick={() => { if (w.txCount > 0) toast.error("Dompet ini sudah punya transaksi, tidak bisa dihapus."); else setDeleting(w); }}><Trash2 className="size-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <WalletDialog value={edit} onClose={() => setEdit(null)} onSaved={invalidate} />
      <DeleteConfirmation open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Hapus dompet?" description={`Dompet “${deleting?.name ?? ""}” beserta saldo awalnya akan dihapus permanen.`} onConfirm={async () => { if (deleting) await remove(deleting); }} />
    </div>
  );
}

function WalletDialog({ value, onClose, onSaved }: { value: WalletWithBalance | "new" | null; onClose: () => void; onSaved: () => void }) {
  const isNew = value === "new";
  const w = value && value !== "new" ? value : null;
  return (
    <Dialog open={!!value} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="pr-8 text-left">{isNew ? "Tambah dompet" : "Ubah dompet"}</DialogTitle></DialogHeader>
        {value && <WalletForm key={w?.id ?? "new"} wallet={w} onDone={() => { onSaved(); onClose(); }} />}
      </DialogContent>
    </Dialog>
  );
}

function WalletForm({ wallet, onDone }: { wallet: WalletWithBalance | null; onDone: () => void }) {
  const [type, setType] = useState<WalletType>(wallet?.type ?? "ewallet");
  const [name, setName] = useState(wallet?.name ?? "");
  const [template, setTemplate] = useState<string | null>(wallet?.template ?? null);
  const [initial, setInitial] = useState(Number(wallet?.initial_balance ?? 0));
  const [busy, setBusy] = useState(false);
  const templates = type === "bank" ? BANK_TEMPLATES : type === "ewallet" ? EWALLET_TEMPLATES : [];

  const save = async () => {
    if (!name.trim()) return toast.error("Nama dompet wajib diisi");
    setBusy(true);
    const payload = { name: name.trim().slice(0, 40), type, template, initial_balance: initial };
    const { error } = wallet
      ? await supabase.from("wallets").update(payload).eq("id", wallet.id)
      : await supabase.from("wallets").insert(payload);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Dompet tersimpan");
    onDone();
  };

  return (
    <div className="min-w-0 space-y-4">
      {!wallet && (
        <div className="grid grid-cols-4 gap-1.5">
          {TYPES.map((t) => (
            <button key={t} onClick={() => { setType(t); setTemplate(null); }} className={cn("retro-sm flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-xs font-bold", type === t ? "bg-primary" : "bg-card")}>
              {(() => { const I = WALLET_TYPE_ICON[t]; return <I className="size-5" />; })()}<span className="truncate">{WALLET_TYPE_LABEL[t]}</span>
            </button>
          ))}
        </div>
      )}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {templates.map((t) => (
            <button key={t} onClick={() => { setTemplate(t); setName(t); }} className={cn("retro-sm rounded-full px-3 py-1 text-sm font-bold", template === t ? "bg-primary" : "bg-card")}>{t}</button>
          ))}
        </div>
      )}
      <input className="retro-sm w-full rounded-xl bg-paper px-3 py-2.5 font-semibold" placeholder="Nama dompet" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
      <div>
        <p className="mb-2 text-sm font-bold">Saldo awal (uang yang sudah ada sebelum pakai NataKas)</p>
        <Keypad value={initial} onChange={setInitial} />
      </div>
      <Button className="w-full" disabled={busy} onClick={save}>Simpan</Button>
    </div>
  );
}
