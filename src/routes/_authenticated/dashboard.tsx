import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Hand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl, useFlags, useProfile, useWallets, WALLET_TYPE_ICON, WALLET_TYPE_LABEL, type WalletType } from "@/lib/data";
import { pageInfo, totals, useTransactions, useTxPage } from "@/lib/tx";
import { useState } from "react";
import { Pager, TxGroupedList } from "@/components/TxList";
import { ActivityTicker, AutoCarousel, NotifBanner } from "@/components/DashboardWidgets";
import { fromJakarta, jakartaParts, MONTHS, rupiah } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Beranda — NataKas" }, { name: "description", content: "Ringkasan saldo dan arus kas kamu." }, { property: "og:title", content: "Beranda — NataKas" }, { property: "og:description", content: "Ringkasan saldo dan arus kas kamu." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

function useBanners() {
  return useQuery({
    queryKey: ["banners", "published"],
    queryFn: async () => {
      const { data } = await supabase.from("banners").select("*").eq("published", true).order("sort_order");
      return Promise.all((data ?? []).map(async (b) => ({
        ...b,
        desktop: b.image_desktop ? await signedUrl("banners", b.image_desktop) : null,
        mobile: b.image_mobile ? await signedUrl("banners", b.image_mobile) : null,
      })));
    },
    staleTime: 5 * 60_000,
  });
}

function Dashboard() {
  const { data: wallets = [] } = useWallets();
  const { data: profile } = useProfile();
  const { data: flags = {} } = useFlags();
  const { data: banners = [] } = useBanners();
  const p = jakartaParts(new Date());
  const from = fromJakarta(p.year, p.month, 1);
  const { data: monthTx = [] } = useTransactions({ from });
  const [page, setPage] = useState(1);
  const { data: recentPage } = useTxPage(page);
  const recent = recentPage?.rows ?? [];
  const { pages } = pageInfo(recentPage?.total ?? 0, page);
  const t = totals(monthTx);
  const total = wallets.reduce((s, w) => s + w.balance, 0);

  // cash always visible; bank/ewallet/custom only when the user has a wallet of that type
  const groups = (["cash", "bank", "ewallet", "custom"] as WalletType[]).filter((g) => g === "cash" || wallets.some((w) => w.type === g));

  return (
    <div className="space-y-6">
      <p className="flex items-center gap-2 font-bold text-muted-foreground">Halo, {profile?.display_name ?? "kamu"} <Hand className="size-4" /></p>

      <div className="retro-lg relative overflow-hidden rounded-3xl bg-ink p-6 text-paper">
        <div className="absolute -right-10 -top-10 size-40 rounded-full bg-primary opacity-90" />
        <div className="absolute -right-2 top-16 size-24 rounded-full bg-secondary opacity-90" />
        <div className="relative">
          <div className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Total saldo</div>
          <div className="num mt-2 text-4xl font-bold sm:text-5xl">{rupiah(total)}</div>
          <div className="mt-8 flex items-end justify-between text-xs font-bold uppercase tracking-widest opacity-80">
            <span>{profile?.display_name ?? "NataKas"}</span>
            <span className="num">{wallets.length} dompet</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {groups.map((g) => (
          <Link to="/dompet" key={g} className="retro press rounded-2xl bg-card p-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">{(() => { const I = WALLET_TYPE_ICON[g]; return <I className="size-4" />; })()} {WALLET_TYPE_LABEL[g]}</div>
            <div className="num font-bold">{rupiah(wallets.filter((w) => w.type === g).reduce((s, w) => s + w.balance, 0))}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link to="/catat" search={{ type: "income" }} className="retro press flex flex-col items-center gap-1 rounded-2xl bg-income p-3 font-bold"><ArrowDownLeft /> Pemasukan</Link>
        <Link to="/catat" search={{ type: "expense" }} className="retro press flex flex-col items-center gap-1 rounded-2xl bg-expense p-3 font-bold"><ArrowUpRight /> Pengeluaran</Link>
        {flags.transfer !== false && <Link to="/catat" search={{ type: "transfer" }} className="retro press flex flex-col items-center gap-1 rounded-2xl bg-transfer p-3 font-bold"><ArrowLeftRight /> Transfer</Link>}
      </div>

      {flags.banners !== false && banners.length > 0 && (
        <AutoCarousel count={banners.length}>
          {banners.map((b) => {
            const inner = (
              <div className="retro relative w-full shrink-0 snap-start overflow-hidden rounded-2xl bg-lilac">
                {(b.desktop || b.mobile) && (
                  <picture>
                    {b.desktop && <source media="(min-width: 768px)" srcSet={b.desktop} />}
                    <img src={b.mobile ?? b.desktop ?? ""} alt={b.title} loading="lazy" className="aspect-[3/1] w-full object-cover md:aspect-[4/1]" />
                  </picture>
                )}
                <div className="p-4"><div className="font-extrabold">{b.title}</div>{b.body && <p className="text-sm">{b.body}</p>}</div>
              </div>
            );
            return b.link_url ? <a key={b.id} href={b.link_url} target="_blank" rel="noreferrer" className="w-full shrink-0 snap-start">{inner}</a> : <div key={b.id} className="w-full shrink-0 snap-start">{inner}</div>;
          })}
        </AutoCarousel>
      )}

      <NotifBanner />
      <ActivityTicker />

      <section className="retro rounded-2xl bg-card p-4">
        <h2 className="font-extrabold">{MONTHS[p.month - 1]} {p.year}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-income/40 p-3"><div className="text-xs font-bold">Pemasukan</div><div className="num font-bold">{rupiah(t.income)}</div></div>
          <div className="rounded-xl bg-expense/40 p-3"><div className="text-xs font-bold">Pengeluaran</div><div className="num font-bold">{rupiah(t.expense)}</div></div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between"><h2 className="font-extrabold">Transaksi terbaru</h2><Link to="/riwayat" className="text-sm font-bold underline">Lihat semua</Link></div>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada transaksi. Mulai catat sekarang!</p> : <><TxGroupedList txs={recent} /><Pager page={page} pages={pages} onChange={setPage} /></>}
      </section>
    </div>
  );
}
