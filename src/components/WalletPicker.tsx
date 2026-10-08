import { Check, Layers } from "lucide-react";
import { WALLET_TYPE_ICON, WALLET_TYPE_LABEL, type WalletType, type WalletWithBalance } from "@/lib/data";
import { rupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Display order of wallet type groups in the picker. */
const GROUP_ORDER: WalletType[] = ["cash", "ewallet", "bank", "custom"];

/** Card-style wallet selector with icon and balance, grouped by wallet type (used in the record form). */
export function WalletPicker({ wallets, value, onChange }: { wallets: WalletWithBalance[]; value: string; onChange: (id: string) => void }) {
  if (!wallets.length) return <p className="retro-sm rounded-xl bg-card p-3 text-sm text-muted-foreground">Belum ada dompet tersedia.</p>;
  const groups = GROUP_ORDER.map((t) => ({ type: t, items: wallets.filter((w) => w.type === t) })).filter((g) => g.items.length > 0);
  return (
    <div role="radiogroup" className="space-y-3">
      {groups.map((g) => {
        const GI = WALLET_TYPE_ICON[g.type];
        return (
          <div key={g.type} className="space-y-1.5">
            <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
              <GI className="size-3.5" /> {WALLET_TYPE_LABEL[g.type]}
            </span>
            <div className="grid grid-cols-1 gap-2 min-[380px]:grid-cols-2">
              {g.items.map((w) => {
                const I = WALLET_TYPE_ICON[w.type];
                const on = w.id === value;
                return (
                  <button key={w.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(w.id)}
                    className={cn("retro-sm press relative flex min-w-0 items-center gap-2.5 rounded-xl p-2.5 text-left", on ? "bg-primary" : "bg-card")}>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-paper"><I className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold">{w.name}</span>
                      <span className="num block truncate text-xs font-bold opacity-80">{rupiah(w.balance)}</span>
                    </span>
                    {on && <Check className="size-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Horizontal chip filter for the history page. */
export function WalletFilter({ wallets, value, onChange }: { wallets: WalletWithBalance[]; value: string; onChange: (id: string) => void }) {
  const items = [{ id: "all", name: "Semua dompet", Icon: Layers, label: "" }, ...wallets.map((w) => ({ id: w.id, name: w.name, Icon: WALLET_TYPE_ICON[w.type], label: WALLET_TYPE_LABEL[w.type] }))];
  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Filter dompet">
      <div className="flex w-max gap-2">
        {items.map(({ id, name, Icon, label }) => (
          <button key={id} type="button" role="radio" aria-checked={value === id} title={label || undefined} onClick={() => onChange(id)}
            className={cn("retro-sm press inline-flex max-w-[11rem] items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold", value === id ? "bg-primary" : "bg-card")}>
            <Icon className="size-4 shrink-0" /><span className="truncate">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
