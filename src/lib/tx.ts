import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tx } from "@/lib/data";
import { dayKey, daysInMonth, fromJakarta } from "@/lib/format";

export function useTransactions(range?: { from?: Date; to?: Date }, limit = 500) {
  return useQuery({
    queryKey: ["transactions", range?.from?.toISOString() ?? null, range?.to?.toISOString() ?? null, limit],
    queryFn: async () => {
      let q = supabase.from("transactions").select("*").order("occurred_at", { ascending: false }).limit(limit);
      if (range?.from) q = q.gte("occurred_at", range.from.toISOString());
      if (range?.to) q = q.lt("occurred_at", range.to.toISOString());
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Tx[];
    },
  });
}

export const PAGE_SIZE = 10;

/** Clamp page (1-based) and compute the inclusive row range + page count. */
export function pageInfo(total: number, page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1, Math.floor(page)), pages);
  return { page: p, pages, from: (p - 1) * size, to: p * size - 1 };
}

/** One page of transactions (10 per page), filtered server-side. */
export function useTxPage(page: number, filter: { type?: Tx["type"] | "all"; wallet?: string } = {}) {
  return useQuery({
    queryKey: ["transactions", "page", page, filter.type ?? "all", filter.wallet ?? "all"],
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { from, to } = pageInfo(Number.MAX_SAFE_INTEGER, page);
      let q = supabase.from("transactions").select("*", { count: "exact" })
        .order("occurred_at", { ascending: false }).order("id").range(from, to);
      if (filter.type && filter.type !== "all") q = q.eq("type", filter.type);
      if (filter.wallet && filter.wallet !== "all") q = q.or(`wallet_id.eq.${filter.wallet},to_wallet_id.eq.${filter.wallet}`);
      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: (data ?? []) as Tx[], total: count ?? 0 };
    },
  });
}

export function useInvalidateMoney() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["wallets"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };
}

/** Groups already-sorted transactions by Jakarta day key, preserving order. */
export function groupByDay<T extends { occurred_at: string }>(txs: T[]): [string, T[]][] {
  const m = new Map<string, T[]>();
  for (const t of txs) {
    const k = dayKey(t.occurred_at);
    const arr = m.get(k);
    if (arr) arr.push(t); else m.set(k, [t]);
  }
  return [...m.entries()];
}

export function totals(txs: Pick<Tx, "type" | "amount">[]) {
  let income = 0, expense = 0, transfer = 0;
  for (const t of txs) {
    const a = Number(t.amount);
    if (t.type === "income") income += a;
    else if (t.type === "expense") expense += a;
    else transfer += a;
  }
  return { income, expense, transfer, net: income - expense };
}

/** Weeks Monday–Sunday; week 1 contains the 1st. Returns day numbers clipped to the month. */
export function weeksOfMonth(y: number, m: number): number[][] {
  const dim = daysInMonth(y, m);
  const weeks: number[][] = [];
  let cur: number[] = [];
  for (let d = 1; d <= dim; d++) {
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun
    if (dow === 1 && cur.length) { weeks.push(cur); cur = []; }
    cur.push(d);
  }
  if (cur.length) weeks.push(cur);
  return weeks;
}

/** Jakarta-local day range [start, end) */
export function dayRange(y: number, m: number, d: number) {
  return { from: fromJakarta(y, m, d), to: new Date(fromJakarta(y, m, d).getTime() + 86400000) };
}
