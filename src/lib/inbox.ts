import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const [a, r] = await Promise.all([
        supabase.from("announcements").select("id, subject, body, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("announcement_reads").select("announcement_id"),
      ]);
      if (a.error) throw a.error;
      const read = new Set((r.data ?? []).map((x) => x.announcement_id));
      return (a.data ?? []).map((m) => ({ ...m, read: read.has(m.id) }));
    },
    refetchInterval: 60_000,
  });
}

export async function markRead(id: string) {
  await supabase.from("announcement_reads").upsert({ announcement_id: id }, { onConflict: "user_id,announcement_id", ignoreDuplicates: true });
}

/** Show a notification on this device only. Uses a service worker (mandatory on Android Chrome). */
export async function showLocalNotification(title: string, body: string) {
  if (typeof Notification === "undefined") throw new Error("Browser ini tidak mendukung notifikasi");
  const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
  if (perm !== "granted") throw new Error("Izin notifikasi belum diberikan di perangkat ini");
  const opts = { body, icon: "/favicon.ico" };
  if ("serviceWorker" in navigator) {
    try {
      await navigator.serviceWorker.register("/notify-sw.js");
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000)),
      ]);
      await reg.showNotification(title, opts);
      return;
    } catch {
      // fall through to the constructor (desktop browsers)
    }
  }
  try {
    new Notification(title, opts);
  } catch {
    throw new Error("Notifikasi tidak bisa ditampilkan di sini. Coba buka aplikasi di tab browser biasa (bukan di dalam editor).");
  }
}
