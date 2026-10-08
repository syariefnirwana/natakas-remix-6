import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { jakartaParts } from "@/lib/format";

export const NOTIF_DISMISS_KEY = "natakas-notif-dismissed";

/** Auto-advancing horizontal carousel (only when more than one slide). */
export function AutoCarousel({ children, count, interval = 4500 }: { children: React.ReactNode; count: number; interval?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      if (paused.current) return;
      setIdx((i) => {
        const n = (i + 1) % count;
        const el = ref.current;
        if (el) el.scrollTo({ left: el.clientWidth * n, behavior: "smooth" });
        return n;
      });
    }, interval);
    return () => clearInterval(id);
  }, [count, interval]);

  return (
    <div className="space-y-2">
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory gap-0 overflow-x-auto"
        onPointerDown={() => (paused.current = true)}
        onPointerUp={() => setTimeout(() => (paused.current = false), 3000)}
        onScroll={(e) => { const el = e.currentTarget; if (el.clientWidth) setIdx(Math.round(el.scrollLeft / el.clientWidth)); }}
      >
        {children}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-foreground" : "w-1.5 bg-muted-foreground/40"}`} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Banner asking for browser notification permission. */
export function NotifBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof Notification === "undefined") return;
    setShow(Notification.permission === "default" && localStorage.getItem(NOTIF_DISMISS_KEY) !== "1");
  }, []);
  if (!show) return null;
  const close = () => { localStorage.setItem(NOTIF_DISMISS_KEY, "1"); setShow(false); };
  return (
    <div className="retro flex flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row sm:items-center">
      <Bell className="size-6 shrink-0" />
      <p className="flex-1 text-sm font-bold">Aktifkan notifikasi agar NataKas bisa mengingatkan kamu mencatat keuangan.</p>
      <div className="flex gap-2">
        <Button className="bg-info text-info-foreground hover:bg-info/90" onClick={async () => { await Notification.requestPermission(); close(); }}>Setuju</Button>
        <Button variant="destructive" onClick={close}>Tolak</Button>
      </div>
    </div>
  );
}

/** Anonymous feed of the latest recordings across all users, refreshed every 15s. */
export function ActivityTicker() {
  const { data = [] } = useQuery({
    queryKey: ["recent_activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recent_activity", { _limit: 15 });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 15_000,
  });
  if (data.length === 0) return null;
  const fmt = (s: string) => { const p = jakartaParts(new Date(s)); const z = (n: number) => String(n).padStart(2, "0"); return `${z(p.day)}-${z(p.month)} ${z(p.hour)}:${z(p.minute)}`; };
  return (
    <section className="retro overflow-hidden rounded-2xl bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Radio className="size-3.5 animate-pulse" /> Aktivitas terbaru</div>
      <div className="relative overflow-hidden">
        <div className="ticker flex w-max gap-8 whitespace-nowrap text-sm">
          {[...data, ...data].map((a, i) => (
            <span key={i}>User <b>{a.initial}</b> telah melakukan pencatatan uang <b>Rp •••••</b> pada {fmt(a.created_at)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
