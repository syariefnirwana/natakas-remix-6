import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Wallet = Database["public"]["Tables"]["wallets"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Tx = Database["public"]["Tables"]["transactions"]["Row"];
export type WalletType = Database["public"]["Enums"]["wallet_type"];
export type TxType = Database["public"]["Enums"]["tx_type"];

export const WALLET_TYPE_LABEL: Record<WalletType, string> = {
  cash: "Cash",
  bank: "Bank",
  ewallet: "E-wallet",
  custom: "Custom",
};
export { WALLET_TYPE_ICON, categoryIcon } from "./icons";
export const EWALLET_TEMPLATES = ["GoPay", "OVO", "DANA", "ShopeePay", "LinkAja", "i.saku", "Flip", "Jenius Pay"];
export const BANK_TEMPLATES = ["BCA", "BRI", "BNI", "Mandiri", "BSI", "CIMB Niaga", "Permata", "Jago", "SeaBank", "blu"];
export const TX_LABEL: Record<TxType, string> = { income: "Pemasukan", expense: "Pengeluaran", transfer: "Transfer" };

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
}

export function useAccountState() {
  return useQuery({
    queryKey: ["account-state"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("my_account_state");
      if (error) throw error;
      return data?.[0] ?? { frozen: false, reason: null, is_admin: false };
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const u = (await supabase.auth.getUser()).data.user;
      if (!u) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useAvatarUrl(raw: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar", raw],
    enabled: !!raw,
    queryFn: async () => {
      if (!raw) return null;
      if (raw.startsWith("http")) return raw;
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(raw, 3600);
      if (error) throw error;
      return data?.signedUrl ?? null;
    },
  });
}

export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: async () => {
      const [{ data: w, error }, { data: b, error: e2 }] = await Promise.all([
        supabase.from("wallets").select("*").order("created_at"),
        supabase.rpc("wallet_balances"),
      ]);
      if (error) throw error;
      if (e2) throw e2;
      const map = new Map((b ?? []).map((x) => [x.wallet_id, x]));
      return (w ?? []).map((x) => ({
        ...x,
        balance: Number(map.get(x.id)?.balance ?? x.initial_balance),
        txCount: Number(map.get(x.id)?.tx_count ?? 0),
      }));
    },
  });
}
export type WalletWithBalance = Wallet & { balance: number; txCount: number };

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFlags() {
  return useQuery({
    queryKey: ["flags"],
    queryFn: async () => {
      const { data } = await supabase.from("feature_flags").select("*");
      const m: Record<string, boolean> = {};
      (data ?? []).forEach((f) => (m[f.key] = f.enabled));
      return m;
    },
    staleTime: 60_000,
  });
}

export function useReminder() {
  return useQuery({
    queryKey: ["reminder"],
    queryFn: async () => (await supabase.from("reminder_settings").select("*").eq("id", 1).maybeSingle()).data,
    staleTime: 5 * 60_000,
  });
}

export async function signedUrl(bucket: string, path: string, ttl = 3600) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, ttl);
  return data?.signedUrl ?? null;
}

export async function compressImage(file: File, max = 1600, quality = 0.8): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("File harus berupa gambar");
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const context = c.getContext("2d");
  if (!context) { bmp.close(); throw new Error("Gagal memproses gambar"); }
  context.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("Gagal memproses gambar"))), "image/jpeg", quality));
}
