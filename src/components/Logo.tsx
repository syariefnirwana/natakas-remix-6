import { Link } from "@tanstack/react-router";

export function Logo({ to = "/" }: { to?: "/" | "/dashboard" }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="NataKas beranda">
      <span className="retro-sm flex size-9 rotate-[-6deg] items-center justify-center rounded-xl bg-primary font-display text-lg font-extrabold">N</span>
      <span className="font-display text-xl font-extrabold tracking-tight">NataKas</span>
    </Link>
  );
}
