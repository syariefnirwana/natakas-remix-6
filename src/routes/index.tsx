import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { title: "NataKas — Catat Keuangan Pribadi dengan Cepat" },
      { name: "description", content: "Catat pemasukan, pengeluaran, dan transfer antar-dompet dengan cepat. Ekspor laporan ke PDF dan Excel." },
      { property: "og:title", content: "NataKas — Catat Keuangan Pribadi" },
      { property: "og:description", content: "Catat pemasukan, pengeluaran, dan transfer dengan cepat." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <Button asChild variant="outline" size="sm"><Link to="/auth">Masuk</Link></Button>
      </header>
      <section className="py-16 text-center">
        <h1 className="text-4xl font-extrabold sm:text-6xl">Catat uangmu, <span className="retro-sm inline-block rotate-[-2deg] rounded-xl bg-primary px-2">secepat kilat.</span></h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">Pemasukan, pengeluaran, dan transfer antar-dompet dalam beberapa ketukan. Datamu privat, hanya untukmu.</p>
        <Button asChild size="lg" className="mt-8"><Link to="/auth">Mulai gratis</Link></Button>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {([[Zap, "Keypad cepat", "Rangkai nominal dengan tombol Rp500 sampai Rp100.000."], [Wallet, "Banyak dompet", "Cash, bank, e-wallet, dan dompet custom."], [FileText, "Laporan", "Ekspor PDF & Excel lengkap dengan foto bukti."]] as const).map(([E, t, d]) => (
          <div key={t} className="retro rounded-2xl bg-card p-5">
            <E className="size-8" />
            <h3 className="mt-2 text-lg font-extrabold">{t}</h3>
            <p className="text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
