export const TZ = "Asia/Jakarta";

export function rupiah(n: number, opts?: { sign?: boolean }) {
  const s = new Intl.NumberFormat("id-ID").format(Math.abs(Math.round(n)));
  const prefix = opts?.sign ? (n < 0 ? "−" : "+") : n < 0 ? "−" : "";
  return `${prefix}Rp${s}`;
}

/** Jakarta-local parts of a date */
export function jakartaParts(d: Date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const p: Record<string, string> = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, x.value]));
  const g = (k: string) => Number(p[k] ?? 0);
  return {
    year: g("year"),
    month: g("month"),
    day: g("day"),
    hour: g("hour"),
    minute: g("minute"),
    second: g("second"),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Build a Date from Jakarta-local components (UTC+7, no DST) */
export function fromJakarta(y: number, m: number, d: number, h = 0, mi = 0, s = 0) {
  return new Date(`${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}+07:00`);
}

export function dayKey(d: Date | string) {
  const p = jakartaParts(new Date(d));
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function fmtDayLabel(key: string) {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  const dt = fromJakarta(y, m, d, 12);
  const today = dayKey(new Date());
  const yest = dayKey(new Date(Date.now() - 86400000));
  const base = new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
  if (key === today) return `Hari ini · ${base}`;
  if (key === yest) return `Kemarin · ${base}`;
  return base;
}

export function fmtTime(d: Date | string) {
  const p = jakartaParts(new Date(d));
  return `${pad(p.hour)}:${pad(p.minute)}:${pad(p.second)}`;
}

export function fmtDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date(d));
}

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

const ERR_ID: [RegExp, string][] = [
  [/invalid login credentials/i, "Email atau kata sandi salah."],
  [/email not confirmed/i, "Email belum dikonfirmasi. Cek kotak masuk (atau folder spam) lalu klik link konfirmasi."],
  [/user already registered|already been registered/i, "Email ini sudah terdaftar. Silakan masuk, atau pakai tombol Google jika dulu daftar lewat Google."],
  [/password should be at least|weak password/i, "Kata sandi terlalu pendek/lemah. Minimal 6 karakter."],
  [/pwned|leaked|compromised/i, "Kata sandi ini pernah bocor di internet. Pakai kata sandi lain."],
  [/rate limit|too many requests|security purposes/i, "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi."],
  [/unsupported provider|provider is not enabled/i, "Login Google belum aktif di server. Hubungi admin."],
  [/popup.*(closed|blocked)|cancel/i, "Jendela login Google ditutup atau diblokir browser. Izinkan pop-up lalu coba lagi."],
  [/signups not allowed|signup is disabled/i, "Pendaftaran akun baru sedang ditutup."],
  [/database error saving new user/i, "Gagal membuat akun di server. Coba lagi beberapa saat."],
  [/failed to fetch|network/i, "Koneksi internet bermasalah. Periksa jaringan lalu coba lagi."],
];

export function errMsg(e: unknown) {
  const raw = e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : typeof e === "string" ? e : "";
  if (!raw) return "Terjadi kesalahan. Coba lagi.";
  for (const [re, msg] of ERR_ID) if (re.test(raw)) return msg;
  return raw;
}
