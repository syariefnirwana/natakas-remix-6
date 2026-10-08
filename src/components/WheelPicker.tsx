import { useEffect, useRef } from "react";
import { MONTHS, daysInMonth } from "@/lib/format";

const ITEM_H = 40;

function Wheel({ items, value, onChange, label, width = "w-16" }: { items: { v: number; l: string }[]; value: number; onChange: (v: number) => void; label: string; width?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const idx = Math.max(0, items.findIndex((i) => i.v === value));

  useEffect(() => {
    const el = ref.current;
    if (el && Math.abs(el.scrollTop - idx * ITEM_H) > 2) el.scrollTo({ top: idx * ITEM_H });
  }, [idx, items.length]);

  const onScroll = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      if (items[i] && items[i].v !== value) onChange(items[i].v);
    }, 90);
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className={`relative ${width}`} style={{ height: ITEM_H * 5 }}>
        <div className="pointer-events-none absolute inset-x-0 z-0 rounded-lg border-2 border-ink bg-primary" style={{ top: ITEM_H * 2, height: ITEM_H }} />
        <div
          ref={ref}
          onScroll={onScroll}
          role="listbox"
          aria-label={label}
          className="no-scrollbar relative z-10 h-full snap-y snap-mandatory overflow-y-scroll"
          style={{ maskImage: "linear-gradient(transparent, black 30%, black 70%, transparent)" }}
        >
          <div style={{ height: ITEM_H * 2 }} />
          {items.map((it) => (
            <div key={it.v} role="option" aria-selected={it.v === value} className={`num flex snap-center items-center justify-center text-sm ${it.v === value ? "font-bold" : "opacity-60"}`} style={{ height: ITEM_H }}>
              {it.l}
            </div>
          ))}
          <div style={{ height: ITEM_H * 2 }} />
        </div>
      </div>
    </div>
  );
}

export type DT = { year: number; month: number; day: number; hour: number; minute: number };
const pad = (n: number) => String(n).padStart(2, "0");

export function WheelDateTimePicker({ value, onChange }: { value: DT; onChange: (v: DT) => void }) {
  const nowY = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => nowY - 8 + i).map((y) => ({ v: y, l: String(y) }));
  const dim = daysInMonth(value.year, value.month);
  const days = Array.from({ length: dim }, (_, i) => ({ v: i + 1, l: pad(i + 1) }));
  const months = MONTHS.map((m, i) => ({ v: i + 1, l: m.slice(0, 3) }));
  const hours = Array.from({ length: 24 }, (_, i) => ({ v: i, l: pad(i) }));
  const mins = Array.from({ length: 60 }, (_, i) => ({ v: i, l: pad(i) }));

  const set = (patch: Partial<DT>) => {
    const n = { ...value, ...patch };
    n.day = Math.min(n.day, daysInMonth(n.year, n.month));
    onChange(n);
  };

  return (
    <div className="flex flex-wrap items-end justify-center gap-2">
      <Wheel label="Tgl" items={days} value={value.day} onChange={(day) => set({ day })} width="w-12" />
      <Wheel label="Bulan" items={months} value={value.month} onChange={(month) => set({ month })} width="w-16" />
      <Wheel label="Tahun" items={years} value={value.year} onChange={(year) => set({ year })} width="w-16" />
      <div className="w-2" />
      <Wheel label="Jam" items={hours} value={value.hour} onChange={(hour) => set({ hour })} width="w-12" />
      <span className="pb-[92px] font-bold">:</span>
      <Wheel label="Menit" items={mins} value={value.minute} onChange={(minute) => set({ minute })} width="w-12" />
    </div>
  );
}
