import { Delete } from "lucide-react";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK = [500, 1000, 2000, 5000, 10000, 50000, 100000];
const MAX = 999_999_999_999;

export function Keypad({ value, onChange, tone = "primary" }: { value: number; onChange: (v: number) => void; tone?: "income" | "expense" | "transfer" | "primary" }) {
  const add = (n: number) => onChange(Math.min(MAX, value + n));
  const digit = (d: string) => {
    const next = Number(String(value === 0 ? "" : value) + d);
    if (next <= MAX) onChange(next);
  };
  const back = () => onChange(Math.floor(value / 10));
  const toneBg = { income: "bg-income", expense: "bg-expense", transfer: "bg-transfer", primary: "bg-primary" }[tone];

  return (
    <div className="min-w-0 space-y-3">
      <div className={cn("retro rounded-2xl px-4 py-4 text-right", toneBg)}>
        <div className="text-xs font-bold uppercase tracking-widest opacity-70">Nominal</div>
        <div className="num text-3xl font-bold break-all sm:text-4xl" aria-live="polite">{rupiah(value)}</div>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => add(q)} className="retro-sm press shrink-0 rounded-full bg-card px-3 py-2 text-sm font-bold">
            +{rupiah(q)}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 [&>*]:min-w-0">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0"].map((k) => (
          <button key={k} type="button" onClick={() => digit(k)} className="retro-sm press num h-14 rounded-xl bg-card text-xl font-bold">
            {k}
          </button>
        ))}
        <button type="button" onClick={back} onDoubleClick={() => onChange(0)} aria-label="Hapus angka" className="retro-sm press flex h-14 items-center justify-center rounded-xl bg-secondary">
          <Delete className="size-6" />
        </button>
      </div>
      {value > 0 && (
        <button type="button" onClick={() => onChange(0)} className="text-xs font-bold underline">Reset nominal</button>
      )}
    </div>
  );
}
