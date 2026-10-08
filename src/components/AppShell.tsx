import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Home, PlusCircle, History, Wallet, FileText, User, Shield, LogOut, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAccountState, useAvatarUrl, useProfile, useReminder, useUser } from "@/lib/data";
import { jakartaParts, dayKey } from "@/lib/format";
import { Logo } from "./Logo";
import { showLocalNotification } from "@/lib/inbox";
import { useInbox } from "@/lib/inbox";

function InboxBell() {
  const { data = [] } = useInbox();
  const unread = data.filter((m) => !m.read).length;
  return (
    <Link to="/kotak-masuk" aria-label="Kotak masuk" className="retro-sm press relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-card">
      <Bell className="size-5" />
      {unread > 0 && <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
    </Link>
  );
}

const NAV = [
  { to: "/dashboard", label: "Beranda", icon: Home },
  { to: "/riwayat", label: "Riwayat", icon: History },
  { to: "/catat", label: "Catat", icon: PlusCircle },
  { to: "/dompet", label: "Dompet", icon: Wallet },
  { to: "/laporan", label: "Laporan", icon: FileText },
] as const;

export async function signOut(qc: ReturnType<typeof useQueryClient>, navigate: ReturnType<typeof useNavigate>, search?: { frozen?: string }) {
  await qc.cancelQueries();
  qc.clear();
  await supabase.auth.signOut();
  navigate({ to: "/auth", search: search ?? {}, replace: true });
}

function useDailyReminder() {
  const { data: r } = useReminder();
  useEffect(() => {
    if (!r?.enabled || typeof Notification === "undefined") return;
    const tick = () => {
      if (Notification.permission !== "granted") return;
      const p = jakartaParts(new Date());
      const hm = `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
      const k = `natakas-reminder-${dayKey(new Date())}`;
      if (hm >= r.remind_time && !localStorage.getItem(k)) {
        localStorage.setItem(k, "1");
        showLocalNotification("NataKas", r.message).catch(() => {});
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [r]);
}

function HeaderAvatar({ className = "" }: { className?: string }) {
  const { data: profile } = useProfile();
  const { data: user } = useUser();
  const { data: url } = useAvatarUrl(profile?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined));
  const name = profile?.display_name || user?.email || "?";
  const initials = name.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("") || "?";
  return (
    <Link to="/profil" aria-label="Profil" className={`retro-sm press flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky text-sm font-extrabold ${className}`}>
      {url ? <img src={url} alt={name} className="size-full object-cover" referrerPolicy="no-referrer" /> : initials}
    </Link>
  );
}

export function AppShell() {
  const { data: state } = useAccountState();
  const qc = useQueryClient();
  const navigate = useNavigate();
  useDailyReminder();

  useEffect(() => {
    if (state?.frozen) signOut(qc, navigate, { frozen: "1" });
  }, [state?.frozen, qc, navigate]);

  const linkCls = "flex items-center gap-3 rounded-xl px-3 py-2.5 font-bold hover:bg-muted";
  const active = { className: "retro-sm bg-primary" };

  return (
    <div className="min-h-screen md:flex">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-1 border-r-2 border-ink bg-paper p-4 md:flex">
        <div className="mb-6 px-2"><Logo to="/dashboard" /></div>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={linkCls} activeProps={active}>
            <n.icon className="size-5" /> {n.label}
          </Link>
        ))}
        <Link to="/profil" className={linkCls} activeProps={active}><User className="size-5" /> Profil</Link>
        {state?.is_admin && (
          <Link to="/admin" className={linkCls} activeProps={active}><Shield className="size-5" /> Admin Panel</Link>
        )}
        <button onClick={() => signOut(qc, navigate)} className={`${linkCls} mt-auto text-left`}>
          <LogOut className="size-5" /> Keluar
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b-2 border-ink bg-paper px-4 py-3 md:hidden">
        <Logo to="/dashboard" />
        <div className="flex shrink-0 items-center gap-2">
          {state?.is_admin && (
            <Link to="/admin" aria-label="Admin Panel" className="retro-sm press flex size-10 items-center justify-center rounded-xl bg-lilac"><Shield className="size-5" /></Link>
          )}
          <InboxBell />
          <HeaderAvatar />
        </div>
      </header>

      <main className="mx-auto w-full min-w-0 max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-6">
        <div className="mb-4 hidden justify-end gap-2 md:flex"><InboxBell /><HeaderAvatar /></div>
        <Outlet />
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl retro bg-paper p-1.5 md:hidden" aria-label="Navigasi utama">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-bold" activeProps={{ className: "bg-primary" }}>
            <n.icon className={n.to === "/catat" ? "size-6" : "size-5"} />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
