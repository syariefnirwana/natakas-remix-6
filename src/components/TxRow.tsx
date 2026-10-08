import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TxEditDialog } from "@/components/TxEditDialog";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Paperclip, Pencil, Trash2 } from "lucide-react";
import { categoryIcon, signedUrl, useCategories, useWallets, TX_LABEL, type Tx } from "@/lib/data";
import { useInvalidateMoney } from "@/lib/tx";
import { errMsg, fmtDateTime, fmtTime, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TxRow({ tx }: { tx: Tx }) {
  const [open, setOpen] = useState(false);
  const { data: wallets = [] } = useWallets();
  const { data: cats = [] } = useCategories();
  const w = wallets.find((x) => x.id === tx.wallet_id);
  const to = wallets.find((x) => x.id === tx.to_wallet_id);
  const cat = cats.find((c) => c.id === tx.category_id);
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "";
  const title = tx.note || cat?.name || TX_LABEL[tx.type];
  const sub = tx.type === "transfer" ? `${w?.name ?? "?"} → ${to?.name ?? "?"}` : `${cat ? `${cat.name} · ` : ""}${w?.name ?? ""}`;

  return (
    <>
      <button onClick={() => setOpen(true)} className="retro-sm press flex w-full items-center gap-3 rounded-xl bg-card p-3 text-left">
        <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg border-2 border-ink text-lg", `bg-${tx.type}`)}>
          {tx.type === "income" ? <ArrowDownLeft className="size-5" /> : tx.type === "expense" ? <ArrowUpRight className="size-5" /> : <ArrowLeftRight className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{title}</div>
          <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">{cat && (() => { const I = categoryIcon(cat.name); return <I className="size-3 shrink-0" />; })()}<span className="truncate">{sub}</span></div>
        </div>
        <div className="shrink-0 text-right">
          <div className="num font-bold">{sign}{rupiah(Number(tx.amount))}</div>
          <div className="num flex items-center justify-end gap-1 text-xs text-muted-foreground">{fmtTime(tx.occurred_at)}{tx.receipt_path && <Paperclip className="size-3" />}</div>
        </div>
      </button>
      {open && <TxDetail tx={tx} title={title} sub={sub} onClose={() => setOpen(false)} />}
    </>
  );
}

function TxDetail({ tx, title, sub, onClose }: { tx: Tx; title: string; sub: string; onClose: () => void }) {
  const invalidate = useInvalidateMoney();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { data: img } = useQuery({
    queryKey: ["receipt", tx.receipt_path],
    enabled: !!tx.receipt_path,
    queryFn: () => tx.receipt_path ? signedUrl("receipts", tx.receipt_path) : null,
  });
  const del = async () => {
    const { error } = await supabase.from("transactions").delete().eq("id", tx.id);
    if (error) throw error;
    if (tx.receipt_path) await supabase.storage.from("receipts").remove([tx.receipt_path]);
    invalidate();
    toast.success("Transaksi dihapus");
    onClose();
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{TX_LABEL[tx.type]}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div className="num text-3xl font-bold">{rupiah(Number(tx.amount))}</div>
          <div className="font-bold">{title}</div>
          <div className="text-sm text-muted-foreground">{sub}</div>
          <div className="text-sm">Waktu transaksi: <b>{fmtDateTime(tx.occurred_at)} WIB</b></div>
          <div className="text-xs text-muted-foreground">Dicatat: {fmtDateTime(tx.created_at)} WIB</div>
          {tx.receipt_path && (img ? <a href={img} target="_blank" rel="noreferrer"><img src={img} alt="Foto bukti" className="retro-sm mt-2 max-h-80 w-full rounded-xl object-contain" /></a> : <p className="text-sm">Memuat foto…</p>)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setEditing(true)}><Pencil className="size-4" /> Ubah</Button>
          <Button variant="destructive" onClick={() => setDeleting(true)}><Trash2 className="size-4" /> Hapus</Button>
        </div>
        {editing && <TxEditDialog tx={tx} onClose={() => setEditing(false)} onSaved={onClose} />}
        <DeleteConfirmation open={deleting} onOpenChange={setDeleting} title="Hapus transaksi?" description={`Transaksi “${title}” sebesar ${rupiah(Number(tx.amount))} akan dihapus permanen. Saldo dompet akan dihitung ulang.`} onConfirm={del} />
      </DialogContent>
    </Dialog>
  );
}
