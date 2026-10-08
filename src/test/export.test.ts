import { describe, expect, it } from "vitest";
import { reportFileName, walletSummary } from "@/lib/export";

describe("export helpers", () => {
  it("names files with Jakarta time and dashes", () => {
    const n = reportFileName("Oktober 2026", "pdf", new Date("2026-10-08T16:51:05Z"));
    expect(n).toBe("Laporan Oktober 2026 keuangan by NataKas 08-10-2026 23-51-05.pdf");
  });
  it("strips OS-forbidden characters", () => {
    expect(reportFileName("1/10 sd 5:10", "pdf", new Date("2026-10-08T00:00:00Z"))).not.toMatch(/[/:]/);
  });
  it("sums wallet balances", () => {
    const s = walletSummary([{ name: "A", type: "cash", balance: 100, initial_balance: 0 }, { name: "B", type: "bank", initial_balance: 50 }] as never);
    expect(s.total).toBe(150);
  });
});
