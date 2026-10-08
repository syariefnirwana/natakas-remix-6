import {
  Banknote, Building2, Smartphone, Wallet, Utensils, Car, ShoppingBag, Receipt, HeartPulse, GraduationCap,
  Gamepad2, Home, Gift, Briefcase, TrendingUp, Coins, Plane, Shirt, Phone, Zap, Tag, type LucideIcon,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type WalletType = Database["public"]["Enums"]["wallet_type"];

export const WALLET_TYPE_ICON: Record<WalletType, LucideIcon> = {
  cash: Banknote,
  bank: Building2,
  ewallet: Smartphone,
  custom: Wallet,
};

const RULES: [RegExp, LucideIcon][] = [
  [/makan|minum|kuliner|jajan|food|kopi/i, Utensils],
  [/transport|bensin|ojek|parkir|bbm|kendaraan/i, Car],
  [/belanja|shopping|groceri|sembako/i, ShoppingBag],
  [/tagihan|listrik|air|bill/i, Zap],
  [/pulsa|internet|data|telepon/i, Phone],
  [/sehat|obat|dokter|medis/i, HeartPulse],
  [/pendidikan|sekolah|kuliah|kursus|buku/i, GraduationCap],
  [/hiburan|game|film|nonton/i, Gamepad2],
  [/rumah|sewa|kos|kontrakan/i, Home],
  [/hadiah|gift|sedekah|donasi|zakat/i, Gift],
  [/gaji|salary|kerja/i, Briefcase],
  [/investasi|bunga|dividen|saham/i, TrendingUp],
  [/bonus|freelance|usaha|jualan|penjualan/i, Coins],
  [/liburan|travel|wisata/i, Plane],
  [/pakaian|baju|fashion/i, Shirt],
  [/pajak|iuran|cicilan|utang/i, Receipt],
];

/** Picks a Lucide icon from a category name; falls back to a tag. */
export function categoryIcon(name: string): LucideIcon {
  return RULES.find(([r]) => r.test(name))?.[1] ?? Tag;
}
