import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, Settings2, X } from "lucide-react";
import { CategoryManager } from "@/components/CategoryManager";
import { supabase } from "@/integrations/supabase/client";
import { Keypad } from "@/components/Keypad";
import { WalletPicker } from "@/components/WalletPicker";
import { WheelDateTimePicker, type DT } from "@/components/WheelPicker";
import { Button } from "@/components/ui/button";
import { useCategories, useFlags, useUser, useWallets, compressImage, categoryIcon, TX_LABEL, type TxType } from "@/lib/data";
import { useInvalidateMoney } from "@/lib/tx";
import { errMsg, fromJakarta, jakartaParts, rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/catat")({
  validateSearch: (s: Record<string, unknown>): { type?: TxType } =>
    s.type === "income" || s.type === "expense" || s.type === "transfer" ? { type: s.type } : {},
  head: () => ({ meta: [{ title: "Catat Transaksi — NataKas" }, { name: "description", content: "Catat pemasukan, pengeluaran, atau transfer dengan keypad cepat." }, { property: "og:title", content: "Catat Transaksi — NataKas" }, { property: "og:description", content: "Catat pemasukan, pengeluaran, atau transfer dengan keypad cepat." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: CatatPage,
});

function nowDT(): DT {
  const p = jakartaParts(new Date());
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute };
}

function CatatPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const invalidate = useInvalidateMoney();
  const { data: user } = useUser();
  const { data: wallets = [] } = useWallets();
  const { data: cats = [] } = useCategories();
  const { data: flags = {} } = useFlags();
  const [type, setType] = useState<TxType>(search.type ?? "expense");
  const [amount, setAmount] = useState(0);
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [dt, setDt] = useState<DT>(nowDT);
  const [showTime, setShowTime] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState(false);

  useEffect(() => { if (!walletId && wallets[0]) setWalletId(wallets[0].id); }, [wallets, walletId]);
  useEffect(() => setCategoryId(null), [type]);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const kinds: TxType[] = flags.transfer === false ? ["expense", "income"] : ["expense", "income", "transfer"];
  const filteredCats = cats.filter((c) => c.kind === type);

  const save = async () => {
    if (amount <= 0) return toast.error("Nominal harus lebih dari Rp0");
    if (!walletId) return toast.error("Pilih dompet dulu");
    if (type === "transfer" && (!toWalletId || toWalletId === walletId)) return toast.error("Dompet asal dan tujuan harus berbeda");
    setBusy(true);
    try {
      let receipt_path: string | null = null;
      if (file && type !== "transfer" && user) {
        const blob = await compressImage(file);
        receipt_path = `${user.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("receipts").upload(receipt_path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
      }
      const { error } = await supabase.from("transactions").insert({
        type, amount, wallet_id: walletId,
        to_wallet_id: type === "transfer" ? toWalletId : null,
        category_id: type === "transfer" ? null : categoryId,
        note: note.trim() || null,
        occurred_at: fromJakarta(dt.year, dt.month, dt.day, dt.hour, dt.minute, showTime ? 0 : jakartaParts(new Date()).second).toISOString(),
        receipt_path,
      });
      if (error) throw error;
      invalidate();
      toast.success(`${TX_LABEL[type]} ${rupiah(amount)} tersimpan`);
      navigate({ to: "/riwayat" });
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const tone = type;
  const sel = "retro-sm w-full rounded-xl bg-paper px-3 py-2.5 font-semibold";

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-extrabold">Catat</h1>
      <div className="retro-sm grid grid-cols-3 gap-1 rounded-2xl bg-paper p-1">
        {kinds.map((k) => (
          <button key={k} onClick={() => setType(k)} className={cn("rounded-xl py-2 text-sm font-bold", type === k && `retro-sm bg-${k}`)}>
            {TX_LABEL[k]}
          </button>
        ))}
      </div>

      <Keypad value={amount} onChange={setAmount} tone={tone} />

      <div className="space-y-3">
        <div className="space-y-1">
          <span className="text-sm font-bold">{type === "transfer" ? "Dari dompet" : "Dompet"}</span>
          <WalletPicker wallets={wallets} value={walletId} onChange={(id) => { setWalletId(id); if (id === toWalletId) setToWalletId(""); }} />
        </div>
        {type === "transfer" && (
          <div className="space-y-1">
            <span className="text-sm font-bold">Ke dompet</span>
            <WalletPicker wallets={wallets.filter((w) => w.id !== walletId)} value={toWalletId} onChange={setToWalletId} />
            {wallets.length < 2 && <p className="text-xs text-muted-foreground">Tambah dompet kedua di menu Dompet untuk transfer.</p>}
          </div>
        )}
        {type !== "transfer" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Kategori (opsional)</span>
              <button type="button" onClick={() => setManage(true)} className="flex items-center gap-1 text-xs font-bold underline"><Settings2 className="size-3" /> Kelola kategori</button>
            </div>
            {manage && <CategoryManager kind={type as "income" | "expense"} onClose={() => setManage(false)} />}
            <div className="flex flex-wrap gap-2">
              {filteredCats.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategoryId(categoryId === c.id ? null : c.id)} className={cn("retro-sm press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold", categoryId === c.id ? "bg-primary" : "bg-card")}>
                  {(() => { const I = categoryIcon(c.name); return <I className="size-4" />; })()} {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="block space-y-1">
          <span className="text-sm font-bold">Rincian</span>
          <input className={sel} maxLength={200} placeholder="mis. Makan siang warteg" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>

        <div className="retro-sm rounded-xl bg-card p-3">
          <button type="button" className="flex w-full items-center justify-between text-sm font-bold" onClick={() => setShowTime(!showTime)}>
            <span>Waktu: {String(dt.day).padStart(2, "0")}/{String(dt.month).padStart(2, "0")}/{dt.year} {String(dt.hour).padStart(2, "0")}:{String(dt.minute).padStart(2, "0")} WIB</span>
            <span className="underline">{showTime ? "Tutup" : "Ubah"}</span>
          </button>
          {showTime && <div className="mt-3"><WheelDateTimePicker value={dt} onChange={setDt} /></div>}
        </div>

        {type !== "transfer" && flags.receipts !== false && (
          <div>
            {preview ? (
              <div className="relative inline-block">
                <img src={preview} alt="Pratinjau bukti" className="retro-sm h-32 rounded-xl object-cover" />
                <button type="button" aria-label="Hapus foto" onClick={() => setFile(null)} className="retro-sm absolute -right-2 -top-2 rounded-full bg-secondary p-1"><X className="size-4" /></button>
              </div>
            ) : (
              <label className="retro-sm press inline-flex cursor-pointer items-center gap-2 rounded-xl bg-sky px-3 py-2 text-sm font-bold">
                <Camera className="size-4" /> Tambah foto bukti
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>
        )}
      </div>

      <Button size="lg" className="w-full" disabled={busy} onClick={save}>{busy ? "Menyimpan…" : `Simpan ${TX_LABEL[type]}`}</Button>
    </div>
  );
}
