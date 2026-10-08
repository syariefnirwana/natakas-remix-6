import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/components/AppShell";
import { compressImage, useAvatarUrl, useProfile, useUser } from "@/lib/data";
import { errMsg } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { NOTIF_DISMISS_KEY } from "@/components/DashboardWidgets";

export const Route = createFileRoute("/_authenticated/profil")({
  head: () => ({ meta: [{ title: "Profil — NataKas" }, { name: "description", content: "Kelola nama, foto, email, dan kata sandi." }, { property: "og:title", content: "Profil — NataKas" }, { property: "og:description", content: "Kelola nama, foto, email, dan kata sandi." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profil,
});

const inp = "retro-sm w-full rounded-xl bg-paper px-3 py-2.5 font-semibold";

function Profil() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: user } = useUser();
  const { data: profile } = useProfile();
  const { data: avatar } = useAvatarUrl(profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState<"name" | "photo" | "email" | "password" | null>(null);
  const [nameDirty, setNameDirty] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const [perm, setPerm] = useState<string>("default");
  const providers: string[] = (user?.app_metadata?.providers as string[]) ?? [user?.app_metadata?.provider ?? "email"];
  const hasEmail = providers.includes("email");

  useEffect(() => {
    const meta = user?.user_metadata as { full_name?: string; name?: string } | undefined;
    if (!nameDirty) setName(profile?.display_name || meta?.full_name || meta?.name || "");
  }, [profile?.display_name, user?.user_metadata, nameDirty]);
  useEffect(() => { if (typeof Notification !== "undefined") setPerm(Notification.permission); }, []);

  const saveName = async () => {
    if (!user) return toast.error("Sesi berakhir, silakan masuk lagi");
    if (!name.trim()) return toast.error("Nama tidak boleh kosong");
    setBusy("name");
    try {
      const { data, error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 60) }).eq("id", user.id).select("*").single();
      if (error) throw error;
      qc.setQueryData(["profile"], data);
      setNameDirty(false);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Nama tersimpan");
    } catch (error) { toast.error(errMsg(error)); }
    finally { setBusy(null); }
  };
  const upload = async (f?: File) => {
    if (!f || !user) return;
    setBusy("photo");
    try {
      const blob = await compressImage(f, 512);
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      const { data, error: e2 } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id).select("*").single();
      if (e2) throw e2;
      qc.setQueryData(["profile"], data);
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Foto profil diperbarui");
    } catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(null); if (fileInput.current) fileInput.current.value = ""; }
  };
  const changeEmail = async () => {
    setBusy("email");
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: window.location.origin + "/auth" });
      if (error) throw error;
      toast.success("Cek email lama & baru untuk konfirmasi perubahan.");
      setEmail("");
    } catch (error) { toast.error(errMsg(error)); }
    finally { setBusy(null); }
  };
  const changePw = async () => {
    if (pw.length < 6) return toast.error("Minimal 6 karakter");
    setBusy("password");
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Kata sandi diperbarui");
      setPw("");
    } catch (error) { toast.error(errMsg(error)); }
    finally { setBusy(null); }
  };
  const askNotif = async () => {
    if (typeof Notification === "undefined") return toast.error("Browser ini tidak mendukung notifikasi");
    setPerm(await Notification.requestPermission());
  };

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-extrabold">Profil</h1>
      <section className="retro flex items-center gap-4 rounded-2xl bg-card p-4">
        <div className="size-20 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-primary">
          {avatar ? <img src={avatar} referrerPolicy="no-referrer" alt="Foto profil" className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-3xl font-extrabold">{(name || "?")[0]?.toUpperCase()}</div>}
        </div>
        <div className="min-w-0 space-y-1">
           <div className="truncate font-extrabold">{user?.email ?? profile?.email}</div>
          <div className="text-xs text-muted-foreground">Masuk via: {providers.join(", ")}</div>
          <Button size="sm" variant="secondary" disabled={!!busy || !user} onClick={() => fileInput.current?.click()}>{busy === "photo" ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}{busy === "photo" ? "Mengunggah…" : "Ganti foto"}</Button>
          <input ref={fileInput} type="file" aria-label="Foto profil baru" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </section>

      <section className="retro space-y-2 rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">Nama</h2>
        <Input aria-label="Nama" className={inp} value={name} maxLength={60} onChange={(e) => { setNameDirty(true); setName(e.target.value); }} />
        <Button disabled={!!busy || !user} onClick={saveName}>{busy === "name" && <Loader2 className="size-4 animate-spin" />}{busy === "name" ? "Menyimpan…" : "Simpan nama"}</Button>
      </section>

      <section className="retro space-y-2 rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">Email</h2>
        <Input aria-label="Email baru" className={inp} type="email" placeholder="Email baru" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button disabled={!email.trim() || !!busy || !user} onClick={changeEmail}>{busy === "email" && <Loader2 className="size-4 animate-spin" />}Ubah email</Button>
        <p className="text-xs text-muted-foreground">Perubahan email butuh konfirmasi lewat tautan yang dikirim.</p>
      </section>

      <section className="retro space-y-2 rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">Kata sandi</h2>
        {hasEmail ? (<>
          <Input aria-label="Kata sandi baru" className={inp} type="password" placeholder="Kata sandi baru" value={pw} onChange={(e) => setPw(e.target.value)} />
          <Button disabled={!!busy || !user} onClick={changePw}>{busy === "password" && <Loader2 className="size-4 animate-spin" />}Ubah kata sandi</Button>
        </>) : <p className="text-sm">Akun kamu masuk via Google — kata sandi dikelola di akun Google.</p>}
      </section>

      <section className="retro space-y-2 rounded-2xl bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-extrabold">Notifikasi</h2>
          <Switch aria-label="Notifikasi" checked={perm === "granted"} disabled={perm === "granted"} onCheckedChange={(v) => { if (v) { localStorage.removeItem(NOTIF_DISMISS_KEY); if (perm === "denied") toast.info("Izin ditolak browser — buka pengaturan situs di browser, izinkan notifikasi, lalu muat ulang."); else askNotif(); } }} />
        </div>
        <p className="text-sm">Status izin: <b>{perm === "granted" ? "Diizinkan" : perm === "denied" ? "Ditolak" : "Belum diminta"}</b></p>
        {perm === "denied" && <p className="text-xs text-muted-foreground">Untuk mengaktifkan lagi: ketuk ikon gembok di bilah alamat → Izin situs → Notifikasi → Izinkan, lalu muat ulang halaman.</p>}
        {perm === "granted" && <p className="text-xs text-muted-foreground">Untuk mematikan, ubah izin notifikasi di pengaturan browser.</p>}
      </section>

      <Button variant="outline" className="w-full" onClick={() => signOut(qc, navigate)}>Keluar</Button>
    </div>
  );
}
