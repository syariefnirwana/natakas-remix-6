import { useState } from "react";
import { toast } from "sonner";
import { Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keypad } from "@/components/Keypad";
import { WalletPicker } from "@/components/WalletPicker";
import { WheelDateTimePicker, type DT } from "@/components/WheelPicker";
import { CategoryManager } from "@/components/CategoryManager";
import { categoryIcon, useCategories, useWallets, TX_LABEL, type Tx } from "@/lib/data";
import { useInvalidateMoney } from "@/lib/tx";
import { errMsg, fromJakarta, jakartaParts, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Edit a saved transaction. Wallet balances are derived from transactions, so they adjust automatically. */
export function TxEditDialog({ tx, onClose, onSaved }: { tx: Tx; onClose: () => void; onSaved: () => void }) {
  const invalidate = useInvalidateMoney();
  const { data: wallets = [] } = useWallets();
  const { data: cats = [] } = useCategories();
  const p = jakartaParts(new Date(tx.occurred_at));
  const [amount, setAmount] = useState(Number(tx.amount));
  const [walletId, setWalletId] = useState(tx.wallet_id);
  const [toWalletId, setToWalletId] = useState(tx.to_wallet_id ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(tx.category_id);
  const [note, setNote] = useState(tx.note ?? "");
  const [dt, setDt] = useState<DT>({ year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute });
  const [showTime, setShowTime] = useState(false);
  const [manage, setManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const isTransfer = tx.type === "transfer";
  const filteredCats = cats.filter((c) => c.kind === tx.type);

  const save = async () => {
    if (amount <= 0) return toast.error("Nominal harus lebih dari Rp0");
    if (isTransfer && (!toWalletId || toWalletId === walletId)) return toast.error("Dompet asal dan tujuan harus berbeda");
    setBusy(true);
    const { error } = await supabase.from("transactions").update({
      amount, wallet_id: walletId,
      to_wallet_id: isTransfer ? toWalletId : null,
      category_id: isTransfer ? null : categoryId,
      note: note.trim() || null,
      occurred_at: fromJakarta(dt.year, dt.month, dt.day, dt.hour, dt.minute, p.second).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", tx.id);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    invalidate();
    toast.success(`${TX_LABEL[tx.type]} ${rupiah(amount)} diperbarui`);
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ubah {TX_LABEL[tx.type]}</DialogTitle></DialogHeader>
        <Keypad value={amount} onChange={setAmount} tone={tx.type} />
        <div className="space-y-1">
          <span className="text-sm font-bold">{isTransfer ? "Dari dompet" : "Dompet"}</span>
          <WalletPicker wallets={wallets} value={walletId} onChange={(id) => { setWalletId(id); if (id === toWalletId) setToWalletId(""); }} />
        </div>
        {isTransfer && (
          <div className="space-y-1">
            <span className="text-sm font-bold">Ke dompet</span>
            <WalletPicker wallets={wallets.filter((w) => w.id !== walletId)} value={toWalletId} onChange={setToWalletId} />
          </div>
        )}
        {!isTransfer && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Kategori</span>
              <button type="button" onClick={() => setManage(true)} className="flex items-center gap-1 text-xs font-bold underline"><Settings2 className="size-3" /> Kelola</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredCats.map((c) => {
                const I = categoryIcon(c.name);
                return (
                  <button key={c.id} type="button" onClick={() => setCategoryId(categoryId === c.id ? null : c.id)} className={cn("retro-sm press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold", categoryId === c.id ? "bg-primary" : "bg-card")}>
                    <I className="size-4" /> {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <label className="block space-y-1">
          <span className="text-sm font-bold">Rincian</span>
          <input className="retro-sm w-full rounded-xl bg-paper px-3 py-2.5 font-semibold" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="retro-sm rounded-xl bg-card p-3">
          <button type="button" className="flex w-full items-center justify-between gap-2 text-sm font-bold" onClick={() => setShowTime(!showTime)}>
            <span>Waktu: {String(dt.day).padStart(2, "0")}/{String(dt.month).padStart(2, "0")}/{dt.year} {String(dt.hour).padStart(2, "0")}:{String(dt.minute).padStart(2, "0")} WIB</span>
            <span className="underline">{showTime ? "Tutup" : "Ubah"}</span>
          </button>
          {showTime && <div className="mt-3"><WheelDateTimePicker value={dt} onChange={setDt} /></div>}
        </div>
        <Button onClick={save} disabled={busy}>{busy ? "Menyimpan…" : "Simpan perubahan"}</Button>
        {manage && <CategoryManager kind={tx.type as "income" | "expense"} onClose={() => setManage(false)} />}
      </DialogContent>
    </Dialog>
  );
}
