import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { errMsg } from "@/lib/format";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { frozen?: string } => (s.frozen ? { frozen: String(s.frozen) } : {}),
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "Masuk atau Daftar — NataKas" },
      { name: "description", content: "Masuk ke NataKas dengan Google atau email." },
      { property: "og:title", content: "Masuk — NataKas" },
      { property: "og:description", content: "Masuk ke NataKas dengan Google atau email." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { frozen } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const afterLogin = async () => {
    const { data, error } = await supabase.rpc("my_account_state");
    if (error) {
      toast.error("Berhasil masuk, tapi gagal memeriksa status akun: " + errMsg(error));
    }
    if (data?.[0]?.frozen) {
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { frozen: "1" } });
      return;
    }
    navigate({ to: "/dashboard" });
  };

  // Handle return from Google (full-page redirect) or an already-signed-in visit
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const qs = new URLSearchParams(window.location.search);
    const oauthErr = hash.get("error_description") || qs.get("error_description") || hash.get("error") || qs.get("error");
    if (oauthErr) toast.error("Login Google gagal: " + errMsg(oauthErr.replace(/\+/g, " ")));
    let done = false;
    const go = () => { if (!done) { done = true; afterLogin(); } };
    supabase.auth.getSession().then(({ data }) => { if (data.session && !frozen) go(); });
    const { data: sub } = supabase.auth.onAuthStateChange((ev, s) => { if (ev === "SIGNED_IN" && s && !frozen) go(); });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/auth" } });
        if (error) throw error;
        if (data.user && data.user.identities?.length === 0) {
          toast.error("Email ini sudah terdaftar. Silakan masuk, atau pakai tombol Google.");
        } else if (data.session) {
          await afterLogin();
        } else {
          toast.success("Akun dibuat! Cek email (juga folder spam) dan klik link konfirmasi untuk masuk.", { duration: 8000 });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await afterLogin();
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
      if (r.error) { toast.error("Login Google gagal: " + errMsg(r.error)); return; }
      if (r.redirected) return;
      await afterLogin();
    } catch (err) {
      toast.error("Login Google gagal: " + errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="retro-lg w-full max-w-sm space-y-4 rounded-2xl bg-card p-6">
        <Logo />
        {frozen && <div className="retro-sm rounded-xl bg-destructive p-3 text-sm font-bold text-destructive-foreground">Akun kamu dibekukan dan tidak dapat digunakan. Hubungi admin.</div>}
        <h1 className="text-2xl font-extrabold">{mode === "in" ? "Masuk" : "Daftar"}</h1>
        <Button variant="outline" className="w-full" onClick={google} disabled={busy}>Lanjut dengan Google</Button>
        <form onSubmit={submit} className="space-y-3">
          <input className="retro-sm w-full rounded-xl bg-paper px-3 py-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="retro-sm w-full rounded-xl bg-paper px-3 py-2" type="password" required minLength={6} placeholder="Kata sandi" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button className="w-full" disabled={busy}>{mode === "in" ? "Masuk" : "Daftar"}</Button>
        </form>
        <button className="text-sm font-bold underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
          {mode === "in" ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
