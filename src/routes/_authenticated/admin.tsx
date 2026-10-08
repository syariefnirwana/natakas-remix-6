import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Snowflake } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { compressImage, signedUrl, useAccountState, useReminder, useUser } from "@/lib/data";
import { errMsg, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — NataKas" }, { name: "description", content: "Kelola akun, banner, fitur, pengumuman, dan pengingat." }, { property: "og:title", content: "Admin Panel — NataKas" }, { property: "og:description", content: "Kelola akun, banner, fitur, pengumuman, dan pengingat." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Admin,
});

type Tab = "akun" | "banner" | "fitur" | "email" | "pengingat" | "audit";
const TABS: [Tab, string][] = [["akun", "Akun"], ["banner", "Banner"], ["fitur", "Fitur"], ["email", "Pengumuman"], ["pengingat", "Pengingat"], ["audit", "Log"]];
const inp = "retro-sm w-full rounded-xl bg-paper px-3 py-2.5 font-semibold";

function Admin() {
  const { data: state, isLoading } = useAccountState();
  const [tab, setTab] = useState<Tab>("akun");
  if (isLoading) return <p>Memuat…</p>;
  if (!state?.is_admin) return <div className="retro rounded-2xl bg-card p-6"><p className="font-bold">Halaman ini khusus admin.</p><Link to="/dashboard" className="underline">Kembali</Link></div>;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-extrabold">Admin Panel</h1>
      <p className="text-sm text-muted-foreground">Admin tidak dapat melihat transaksi, saldo, foto bukti, atau laporan pengguna.</p>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cn("retro-sm shrink-0 rounded-full px-3 py-1.5 text-sm font-bold", tab === k ? "bg-primary" : "bg-card")}>{l}</button>)}
      </div>
      {tab === "akun" && <Accounts />}
      {tab === "banner" && <Banners />}
      {tab === "fitur" && <Flags />}
      {tab === "email" && <Announce />}
      {tab === "pengingat" && <Reminder />}
      {tab === "audit" && <Audit />}
    </div>
  );
}

function Accounts() {
  const { data: me } = useUser();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({ queryKey: ["admin-accounts"], queryFn: async () => { const { data, error } = await supabase.rpc("admin_list_accounts"); if (error) throw error; return data ?? []; } });
  const adminCount = data.filter((a) => a.is_admin).length;
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-accounts"] });

  const freeze = async (id: string, frozen: boolean) => {
    const reason = frozen ? prompt("Alasan pembekuan (wajib):")?.trim() : null;
    if (frozen && !reason) return;
    const { error } = await supabase.rpc("admin_set_frozen", { _user: id, _frozen: frozen, _reason: reason ?? "" });
    if (error) return toast.error(errMsg(error));
    toast.success(frozen ? "Akun dibekukan" : "Akun dibuka kembali"); refresh();
  };
  const setAdmin = async (id: string, make: boolean) => {
    if (!make && id === me?.id) return toast.error("Tidak bisa mencabut admin diri sendiri");
    if (!make && adminCount <= 1) return toast.error("Harus selalu ada minimal satu admin");
    if (!confirm(make ? "Jadikan admin?" : "Cabut peran admin?")) return;
    const { error } = await supabase.rpc("admin_set_admin", { _user: id, _make: make });
    if (error) return toast.error(errMsg(error));
    toast.success("Peran diperbarui"); refresh();
  };

  const list = data.filter((a) => (a.email ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <input className={inp} placeholder="Cari email…" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="text-sm font-bold">{data.length} akun · {adminCount} admin</p>
      {list.map((a) => (
        <div key={a.user_id} className="retro flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-card p-3">
          <div className="min-w-0">
            <div className="truncate font-bold">{a.email}</div>
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">Metode: {a.providers} · {a.frozen ? <span className="inline-flex items-center gap-1"><Snowflake className="size-3" /> Beku</span> : <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3" /> Aktif</span>}{a.is_admin && <span className="inline-flex items-center gap-1">· <ShieldCheck className="size-3" /> Admin</span>}</div>
          </div>
          <div className="flex gap-2">
            {a.user_id !== me?.id && <Button size="sm" variant={a.frozen ? "outline" : "destructive"} onClick={() => freeze(a.user_id, !a.frozen)}>{a.frozen ? "Buka" : "Bekukan"}</Button>}
            <Button size="sm" variant="outline" onClick={() => setAdmin(a.user_id, !a.is_admin)}>{a.is_admin ? "Cabut admin" : "Jadikan admin"}</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

type BannerForm = { id?: string; title: string; body: string; link_url: string; published: boolean; sort_order: number; image_desktop: string | null; image_mobile: string | null };
const emptyBanner: BannerForm = { title: "", body: "", link_url: "", published: false, sort_order: 0, image_desktop: null, image_mobile: null };

function Banners() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-banners"], queryFn: async () => (await supabase.from("banners").select("*").order("sort_order")).data ?? [] });
  const [form, setForm] = useState<BannerForm | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); qc.invalidateQueries({ queryKey: ["banners"] }); };
  const del = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) throw error;
    refresh();
  };
  if (form) return <BannerEditor value={form} onClose={() => { setForm(null); refresh(); }} />;
  return (
    <div className="space-y-3">
      <Button onClick={() => setForm(emptyBanner)}>+ Banner baru</Button>
      {data.map((b) => (
        <div key={b.id} className="retro flex items-center justify-between gap-2 rounded-2xl bg-card p-3">
          <div><div className="font-bold">{b.title}</div><div className="text-xs text-muted-foreground">{b.published ? "Tayang" : "Draf"} · urutan {b.sort_order}</div></div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setForm({ id: b.id, title: b.title, body: b.body ?? "", link_url: b.link_url ?? "", published: b.published, sort_order: b.sort_order, image_desktop: b.image_desktop, image_mobile: b.image_mobile })}>Ubah</Button>
             <Button size="sm" variant="destructive" onClick={() => setDeleting({ id: b.id, title: b.title })}>Hapus</Button>
          </div>
        </div>
      ))}
      <DeleteConfirmation open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Hapus banner?" description={`Banner “${deleting?.title ?? ""}” akan dihapus permanen dan tidak lagi ditampilkan.`} onConfirm={async () => { if (deleting) await del(deleting.id); }} />
    </div>
  );
}

function BannerEditor({ value, onClose }: { value: BannerForm; onClose: () => void }) {
  const [f, setF] = useState(value);
  const [urls, setUrls] = useState<{ d?: string | null; m?: string | null }>({});
  useEffect(() => {
    (async () => setUrls({ d: f.image_desktop ? await signedUrl("banners", f.image_desktop) : null, m: f.image_mobile ? await signedUrl("banners", f.image_mobile) : null }))();
  }, [f.image_desktop, f.image_mobile]);
  const up = async (file: File | undefined, key: "image_desktop" | "image_mobile") => {
    if (!file) return;
    try {
      const blob = await compressImage(file, key === "image_desktop" ? 1600 : 900, 0.85);
      const path = `${crypto.randomUUID()}.jpg`;
      const { error } = await supabase.storage.from("banners").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error;
      setF({ ...f, [key]: path });
    } catch (e) { toast.error(errMsg(e)); }
  };
  const save = async () => {
    if (!f.title.trim()) return toast.error("Judul wajib");
    const { id, ...p } = f;
    const payload = { ...p, title: p.title.trim(), body: p.body || null, link_url: p.link_url || null };
    const { error } = id ? await supabase.from("banners").update(payload).eq("id", id) : await supabase.from("banners").insert(payload);
    if (error) return toast.error(errMsg(error));
    toast.success("Banner tersimpan"); onClose();
  };
  return (
    <div className="space-y-4">
      <div className="retro space-y-3 rounded-2xl bg-card p-4">
        <input className={inp} placeholder="Judul" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea className={inp} placeholder="Teks (opsional)" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <input className={inp} placeholder="Tautan klik (opsional, https://…)" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} />
        <label className="block text-sm font-bold">Gambar desktop — rekomendasi 1600×400 px (4:1), JPG/PNG
          <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={(e) => up(e.target.files?.[0], "image_desktop")} /></label>
        <label className="block text-sm font-bold">Gambar mobile — rekomendasi 900×300 px (3:1), JPG/PNG
          <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={(e) => up(e.target.files?.[0], "image_mobile")} /></label>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-bold"><Switch checked={f.published} onCheckedChange={(v) => setF({ ...f, published: v })} /> Tayangkan</label>
          <label className="flex items-center gap-2 text-sm font-bold">Urutan <input type="number" className="retro-sm w-20 rounded-lg bg-paper px-2 py-1" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: +e.target.value })} /></label>
        </div>
      </div>
      <h3 className="font-extrabold">Pratinjau</h3>
      <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
        {(["d", "m"] as const).map((k) => (
          <div key={k} className="retro overflow-hidden rounded-2xl bg-lilac">
            <div className="px-3 pt-2 text-xs font-bold">{k === "d" ? "Desktop" : "Mobile"}</div>
            {urls[k] && <img src={urls[k]!} alt="" className={cn("w-full object-cover", k === "d" ? "aspect-[4/1]" : "aspect-[3/1]")} />}
            <div className="p-3"><div className="font-extrabold">{f.title || "Judul banner"}</div>{f.body && <p className="text-sm">{f.body}</p>}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2"><Button onClick={save}>Simpan</Button><Button variant="outline" onClick={onClose}>Batal</Button></div>
    </div>
  );
}

function Flags() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin-flags"], queryFn: async () => (await supabase.from("feature_flags").select("*").order("key")).data ?? [] });
  const set = async (key: string, enabled: boolean) => {
    const { error } = await supabase.from("feature_flags").update({ enabled, updated_at: new Date().toISOString() }).eq("key", key);
    if (error) return toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: ["admin-flags"] }); qc.invalidateQueries({ queryKey: ["flags"] });
  };
  return (
    <div className="space-y-2">
      {data.map((f) => (
        <div key={f.key} className="retro flex items-center justify-between rounded-2xl bg-card p-3">
          <div><div className="font-bold">{f.label}</div><div className="text-xs text-muted-foreground">{f.description}</div></div>
          <Switch checked={f.enabled} onCheckedChange={(v) => set(f.key, v)} />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Menonaktifkan fitur hanya menyembunyikannya; data pengguna tetap aman.</p>
    </div>
  );
}

function Announce() {
  const qc = useQueryClient();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [preview, setPreview] = useState(false);
  const { data: hist = [] } = useQuery({ queryKey: ["announcements"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: count = 0 } = useQuery({ queryKey: ["user-count"], queryFn: async () => (await supabase.rpc("admin_user_count")).data ?? 0 });
  const send = async () => {
    if (!confirm(`Kirim pengumuman ke ${count} pengguna?`)) return;
    const { error } = await supabase.from("announcements").insert({ subject, body, recipient_count: count });
    if (error) return toast.error(errMsg(error));
    toast.success("Pengumuman masuk antrean kirim");
    setSubject(""); setBody(""); setPreview(false);
    qc.invalidateQueries({ queryKey: ["announcements"] });
  };
  return (
    <div className="space-y-4">
      <div className="retro space-y-3 rounded-2xl bg-card p-4">
        <input className={inp} placeholder="Subjek" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea className={cn(inp, "min-h-32")} placeholder="Isi pengumuman" value={body} onChange={(e) => setBody(e.target.value)} />
        {preview && <div className="rounded-xl border-2 border-dashed border-ink p-3"><div className="text-xs font-bold">Pratinjau email</div><div className="font-extrabold">{subject}</div><p className="whitespace-pre-wrap text-sm">{body}</p></div>}
        <div className="flex gap-2">
          <Button variant="outline" disabled={!subject || !body} onClick={() => setPreview(true)}>Pratinjau</Button>
          <Button disabled={!preview} onClick={send}>Kirim ke semua ({count})</Button>
        </div>
      </div>
      <h3 className="font-extrabold">Riwayat</h3>
      {hist.map((h) => <div key={h.id} className="retro-sm rounded-xl bg-card p-3 text-sm"><b>{h.subject}</b> · {h.status} · {h.recipient_count} penerima · {fmtDateTime(h.created_at)}</div>)}
    </div>
  );
}

function Reminder() {
  const qc = useQueryClient();
  const { data } = useReminder();
  const [msg, setMsg] = useState("");
  const [time, setTime] = useState("20:00");
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { if (data) { setMsg(data.message); setTime(data.remind_time); setEnabled(data.enabled); } }, [data]);
  const save = async () => {
    const { error } = await supabase.from("reminder_settings").update({ message: msg, remind_time: time, enabled, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(errMsg(error));
    qc.invalidateQueries({ queryKey: ["reminder"] });
    toast.success("Pengingat tersimpan");
  };
  return (
    <div className="retro space-y-3 rounded-2xl bg-card p-4">
      <label className="flex items-center gap-2 font-bold"><Switch checked={enabled} onCheckedChange={setEnabled} /> Aktif</label>
      <input className={inp} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Pesan pengingat" />
      <label className="block text-sm font-bold">Jam (WIB) <input type="time" className={inp} value={time} onChange={(e) => setTime(e.target.value)} /></label>
      <p className="text-xs text-muted-foreground">Hanya dikirim ke pengguna yang mengizinkan notifikasi browser dan sedang membuka NataKas.</p>
      <Button onClick={save}>Simpan</Button>
    </div>
  );
}

function Audit() {
  const { data = [] } = useQuery({ queryKey: ["audit"], queryFn: async () => (await supabase.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(100)).data ?? [] });
  if (!data.length) return <p className="text-sm text-muted-foreground">Belum ada tindakan admin.</p>;
  return <div className="space-y-2">{data.map((a) => <div key={a.id} className="retro-sm rounded-xl bg-card p-3 text-sm"><b>{a.action}</b> {a.target && `→ ${a.target}`} {a.detail && `· ${a.detail}`}<div className="text-xs text-muted-foreground">{fmtDateTime(a.created_at)}</div></div>)}</div>;
}
