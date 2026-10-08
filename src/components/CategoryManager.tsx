import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { categoryIcon, TX_LABEL, useCategories, useUser, type TxType } from "@/lib/data";
import { useInvalidateMoney } from "@/lib/tx";
import { errMsg } from "@/lib/format";
import { cn } from "@/lib/utils";

const field = "retro-sm w-full min-w-0 rounded-xl bg-paper px-3 py-2 font-semibold";

/** Create / rename / delete the user's own income & expense categories. Default categories are read-only. */
export function CategoryManager({ kind: initialKind, onClose }: { kind: Exclude<TxType, "transfer">; onClose: () => void }) {
  const [kind, setKind] = useState(initialKind);
  const { data: cats = [] } = useCategories();
  const { data: user } = useUser();
  const invalidate = useInvalidateMoney();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const list = cats.filter((c) => c.kind === kind);
  const exists = (n: string, skip?: string) => list.some((c) => c.id !== skip && c.name.trim().toLowerCase() === n.trim().toLowerCase());

  const add = async () => {
    const n = name.trim();
    if (!n) return toast.error("Nama kategori wajib diisi");
    if (exists(n)) return toast.error("Kategori dengan nama itu sudah ada");
    if (!user) return toast.error("Sesi berakhir, silakan masuk lagi");
    const { error } = await supabase.from("categories").insert({ name: n, kind, user_id: user.id });
    if (error) return toast.error(errMsg(error));
    setName(""); invalidate(); toast.success("Kategori ditambahkan");
  };
  const rename = async (id: string) => {
    const n = editName.trim();
    if (!n) return toast.error("Nama kategori wajib diisi");
    if (exists(n, id)) return toast.error("Kategori dengan nama itu sudah ada");
    const { error } = await supabase.from("categories").update({ name: n }).eq("id", id);
    if (error) return toast.error(errMsg(error));
    setEditId(null); invalidate(); toast.success("Kategori diubah");
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    invalidate(); toast.success("Kategori dihapus");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Kelola kategori</DialogTitle></DialogHeader>
        <div className="retro-sm grid grid-cols-2 gap-1 rounded-2xl bg-paper p-1">
          {(["expense", "income"] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className={cn("rounded-xl py-2 text-sm font-bold", kind === k && `retro-sm bg-${k}`)}>{TX_LABEL[k]}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input className={field} maxLength={40} placeholder="Nama kategori baru" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
          <Button onClick={add} aria-label="Tambah kategori"><Plus className="size-4" /></Button>
        </div>
        <ul className="space-y-2">
          {list.map((c) => {
            const I = categoryIcon(c.name);
            const own = !!c.user_id;
            return (
              <li key={c.id} className="retro-sm flex items-center gap-2 rounded-xl bg-card p-2">
                <I className="size-4 shrink-0" />
                {editId === c.id ? (
                  <>
                    <input autoFocus className={field} maxLength={40} value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename(c.id)} />
                    <button aria-label="Simpan" onClick={() => rename(c.id)} className="p-1"><Check className="size-4" /></button>
                    <button aria-label="Batal" onClick={() => setEditId(null)} className="p-1"><X className="size-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate font-bold">{c.name}</span>
                    {own ? (
                      <>
                        <button aria-label={`Ubah ${c.name}`} onClick={() => { setEditId(c.id); setEditName(c.name); }} className="p-1"><Pencil className="size-4" /></button>
                        <Button variant="ghost" size="icon" aria-label={`Hapus ${c.name}`} onClick={() => setDeleting({ id: c.id, name: c.name })} className="text-destructive"><Trash2 className="size-4" /></Button>
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3" /> Bawaan</span>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <DeleteConfirmation open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Hapus kategori?" description={`Kategori “${deleting?.name ?? ""}” akan dihapus. Transaksi lama tetap tersimpan tanpa kategori ini.`} onConfirm={async () => { if (deleting) await remove(deleting.id); }} />
      </DialogContent>
    </Dialog>
  );
}
