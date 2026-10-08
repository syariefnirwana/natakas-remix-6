import { describe, expect, it } from "vitest";
import { groupByDay, pageInfo, totals, weeksOfMonth } from "@/lib/tx";

describe("aturan laporan", () => {
  it("minggu Senin–Minggu, minggu 1 memuat tanggal 1 (Oktober 2026)", () => {
    const w = weeksOfMonth(2026, 10); // 1 Okt 2026 = Kamis
    expect(w[0]).toEqual([1, 2, 3, 4]);
    expect(w[1]).toEqual([5, 6, 7, 8, 9, 10, 11]);
    expect(w[w.length - 1]).toEqual([26, 27, 28, 29, 30, 31]);
  });
  it("transfer tidak dihitung sebagai pemasukan/pengeluaran", () => {
    const t = totals([
      { type: "income", amount: 7000 },
      { type: "expense", amount: 2000 },
      { type: "transfer", amount: 5000 },
    ]);
    expect(t.income).toBe(7000);
    expect(t.expense).toBe(2000);
    expect(t.net).toBe(5000);
  });
  it("10 transaksi per halaman", () => {
    expect(pageInfo(25, 1)).toEqual({ page: 1, pages: 3, from: 0, to: 9 });
    expect(pageInfo(25, 3)).toEqual({ page: 3, pages: 3, from: 20, to: 29 });
    expect(pageInfo(25, 9).page).toBe(3);
    expect(pageInfo(0, 1).pages).toBe(1);
  });
  it("transaksi dikelompokkan per hari (WIB)", () => {
    const g = groupByDay([
      { occurred_at: "2026-10-08T17:30:00Z" }, // 9 Okt 00:30 WIB
      { occurred_at: "2026-10-08T10:00:00Z" }, // 8 Okt
      { occurred_at: "2026-10-08T01:00:00Z" }, // 8 Okt
    ]);
    expect(g.map(([k, v]) => [k, v.length])).toEqual([["2026-10-09", 1], ["2026-10-08", 2]]);
  });
});
