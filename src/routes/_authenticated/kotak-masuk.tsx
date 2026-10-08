import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, MailOpen } from "lucide-react";
import { markRead, useInbox } from "@/lib/inbox";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/kotak-masuk")({
  head: () => ({ meta: [{ title: "Kotak Masuk — NataKas" }, { name: "description", content: "Baca pengumuman dari tim NataKas." }, { property: "og:title", content: "Kotak Masuk — NataKas" }, { property: "og:description", content: "Baca pengumuman dari tim NataKas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Inbox,
});

function Inbox() {
  const { data = [], isLoading, error } = useInbox();
  const qc = useQueryClient();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = async (id: string, read: boolean) => {
    setOpen((o) => (o === id ? null : id));
    if (!read) { await markRead(id); qc.invalidateQueries({ queryKey: ["inbox"] }); }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-extrabold">Kotak Masuk</h1>
      {isLoading ? <p>Memuat…</p> : error ? <p className="text-sm text-destructive">Gagal memuat pesan.</p> : data.length === 0 ? <p className="text-sm text-muted-foreground">Belum ada pesan.</p> : (
        <div className="space-y-2">
          {data.map((m) => (
            <button key={m.id} onClick={() => toggle(m.id, m.read)} className="retro-sm block w-full rounded-xl bg-card p-3 text-left">
              <div className="flex items-start gap-2">
                {m.read ? <MailOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : <Mail className="mt-0.5 size-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className={`truncate ${m.read ? "font-semibold" : "font-extrabold"}`}>{m.subject}</div>
                  <div className="text-xs text-muted-foreground">{fmtDateTime(m.created_at)}</div>
                  {open === m.id && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>}
                </div>
                {!m.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-destructive" />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
