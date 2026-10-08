# 📊 Status & Roadmap Progres NataKas

Dokumen ini adalah acuan progres implementasi fitur untuk AI & developer. Saat melakukan remix atau melanjutkan proyek, **baca dokumen ini terlebih dahulu**.

---

## 📌 Aturan untuk AI Pengerjaan
1. **Dilarang mengubah atau me-refactor** fitur yang sudah bertanda `[x]` kecuali diminta secara spesifik.
2. Selalu gunakan icon dari **Lucide React** (`lucide-react`), jangan gunakan default emoji sistem.
3. Semua komponen input/select/picker harus **custom design**, dilarang memakai elemen HTML default mentah.
4. Jangan pernah mereset database Lovable Cloud atau menghapus trigger `on_auth_user_created`.
5. Setiap menyelesaikan 1 batch/fitur, **wajib ubah status checklist menjadi `[x]`** dan catat perubahan di bagian **Riwayat Perubahan**.

---

## 🗺️ Roadmap & Checklist Revisi (18 Poin)

### 🔹 Batch 1: UI Polish, Responsive & Custom Selectors (Prioritas 1)
- [x] **1.1 Responsif Android/Mobile:** Card dompet di halaman Dompet (`/dompet`) disesuaikan agar proporsional dan fleksibel di semua layar Android tanpa overflow horizontal.
- [x] **1.2 Ganti Semua Default Emoji:** Ganti seluruh emoji di navigasi, card, badge, status, dan kategori menjadi icon Lucide yang rapi.
- [x] **1.3 Foto Profil Header:** Tampilkan avatar/foto profil user di pojok kanan atas header (`AppShell`). Fallback ke inisial jika belum ada foto.
- [x] **1.4 Custom Selector Dompet di Form Catat:** Ganti dropdown default pemilihan dompet saat mencatat pemasukan/pengeluaran/transfer dengan kartu pilihan custom berikon dan bersaldo.
- [x] **1.5 Custom Selector Dompet di Riwayat:** Desain ulang filter dompet di halaman Riwayat agar seragam dengan desain custom app.

### 🔹 Batch 2: Transaksi, Custom Kategori & Pengelompokan (Prioritas 2)
- [x] **2.1 Edit Transaksi:** Tambahkan dialog/fitur edit untuk transaksi yang sudah tersimpan (ubah nominal, dompet, kategori, catatan, tanggal) dengan penyesuaian saldo otomatis.
- [x] **2.2 Custom Kategori Pemasukan/Pengeluaran:** Beri akses user untuk membuat, mengubah, dan menghapus kategori kustom mereka sendiri selain kategori bawaan.
- [x] **2.3 Pengelompokan Transaksi per Hari:** Tampilan riwayat transaksi dikelompokkan dengan header tanggal ("Hari Ini", "Kemarin", "12 Okt 2026", dsb).
- [x] **2.4 Pagination 10 Transaksi per Page:** Berikan paging (10 data per halaman) pada daftar transaksi di Beranda dan Riwayat.

### 🔹 Batch 3: Fitur Export Laporan Lengkap (Prioritas 3)
- [x] **3.1 Pilihan Filter Periode Export:** Pilihan export per harian, mingguan, bulanan, tahunan, seluruhnya, atau custom range tanggal.
- [x] **3.2 PDF Styling & Color Coding:**
  - Pemasukan berwarna **Hijau**
  - Pengeluaran berwarna **Merah**
  - Transfer/Pindah Saldo berwarna **Biru**
- [x] **3.3 Rincian Saldo Dompet di Laporan:** Menampilkan saldo masing-masing dompet/bank/e-wallet serta total saldo keseluruhan.
- [x] **3.4 Watermark PDF:** Watermark semi-transparan dengan teks *"Protected by NataKas"*.
- [x] **3.5 Penamaan File Standar:** Format nama file: `Laporan [Periode] keuangan by NataKas [dd-MM-yyyy HH-mm-ss].pdf` (gunakan tanda strip/dash untuk jam karena sistem operasi tidak mengizinkan tanda `/`).

### 🔹 Batch 4: Banner Carousel, Notifikasi & Real-Time Log (Prioritas 4)
- [x] **4.1 Auto-swipe Banner Dashboard:** Jika banner promo/pengumuman di dashboard > 1, buat otomatis berganti slide (auto-carousel) dengan interval ~4-5 detik.
- [x] **4.2 Banner Izin Notifikasi:** Banner permintaan akses notifikasi di dashboard:
  - Tombol **Setuju (Biru)**: Trigger izin browser notification.
  - Tombol **Tolak (Merah)**: Menutup banner.
- [x] **4.3 Toggle Notifikasi di Profil:** Pengaturan di halaman Profil untuk mengaktifkan kembali izin notifikasi jika sebelumnya ditolak.
- [x] **4.4 Real-time Public Log Ticker:** Widget riwayat anonim di dashboard menampilkan 10–20 data terbaru: *"User [Inisial/Nama] telah melakukan pencatatan uang Rp ••••• pada dd-mm hh:mm"*.

### 🔹 Batch 5: Kotak Masuk (Mail in-App) & Testing Notifikasi (Prioritas 5)
- [x] **5.1 In-App Mailbox:** Halaman / modal kotak masuk pesan tempat user membaca pengumuman yang dikirim oleh Admin.
- [x] **5.2 Uji Coba Notifikasi Mandiri di Admin Panel:** Tombol test notifikasi di Admin Panel yang hanya mengirim notifikasi simulasi ke device admin sendiri (bukan broadcast ke semua user).

### 🔹 Batch 6: Onboarding Interaktif (Tutorial New User) (Prioritas 6)
- [ ] **6.1 Interactive Walkthrough Animasi:**
  - Step 1: Input saldo awal dompet pertama kali setelah signup.
  - Step 2: Panduan cara mencatat pemasukan & pengeluaran.
  - Step 3: Panduan cara mengedit transaksi.
  - Step 4: Panduan cara menghapus transaksi.

---

## 📍 Status Terkini Proyek
- **Backend / Database:** Aktif (Lovable Cloud / Auth / Database / Storage).
- **Status Login:** Google OAuth & Email Login sudah aktif dan berfungsi normal.
- **Pekerjaan Terakhir:** Reset database & perbaikan alur login Google.
- **Pekerjaan Terakhir (update):** Batch 1 selesai.
- **Pekerjaan Terakhir (update):** Batch 2 selesai.
- **Pekerjaan Terakhir (update):** Batch 3 selesai.
- **Pekerjaan Terakhir (update):** Batch 4 selesai.
- **Pekerjaan Terakhir (update):** Batch 5 selesai.
- **Next Task:** **Batch 6 (6.1)**.

### Revisi setelah Batch 2
- [x] Konfirmasi hapus transaksi, kategori, dompet, dan banner memakai dialog custom, dengan Batal, status menghapus, dan penanganan kegagalan.
- [x] Penyimpanan nama dan foto profil diperbaiki; nama dan unggahan foto telah diuji setelah muat ulang halaman dengan akun masuk.

---

## 📝 Riwayat Perubahan (Changelog)
- **2026-10-09 — Batch 5 selesai (5.1–5.2)**
  - Kotak masuk pengumuman + ikon lonceng berlencana belum dibaca: `src/routes/_authenticated/kotak-masuk.tsx`, `src/lib/inbox.ts`, `src/components/AppShell.tsx`; tabel `announcement_reads`: `drizzle/migrations/0003_inbox.sql`
  - Tombol tes notifikasi khusus perangkat admin di tab Pengingat: `src/routes/_authenticated/admin.tsx`
- **2026-10-09 — Batch 4 selesai (4.1–4.4)**
  - Carousel banner otomatis (4,5 dtk), banner izin notifikasi Setuju/Tolak, ticker aktivitas anonim: `src/components/DashboardWidgets.tsx`, `src/routes/_authenticated/dashboard.tsx`
  - Toggle notifikasi di Profil: `src/routes/_authenticated/profil.tsx`
  - Fungsi `recent_activity` (hanya inisial + waktu, tanpa nominal): `drizzle/migrations/0002_public_activity_feed.sql`
- **2026-10-08 — Health check remix + Batch 3 selesai (3.1–3.5)**
  - Trigger `on_auth_user_created` dipasang ulang, izin tabel (termasuk profiles) dipulihkan, backfill profil, baca avatar terbuka: `drizzle/migrations/0001_remix_health_check.sql`. Bucket avatars tetap private (kebijakan workspace memblokir bucket publik).
  - 3.1 Pilihan "Rentang tanggal" (Dari/Sampai, lintas bulan/tahun) di mode Custom: `src/routes/_authenticated/laporan.tsx`
  - 3.2–3.5 PDF berwarna (hijau/merah/biru), tabel saldo per dompet + total (juga di Excel), watermark "Protected by NataKas", nama file standar: `src/lib/export.ts`, tes `src/test/export.test.ts`
- **2026-10-08 — Revisi hapus custom & profil**
  - Dialog hapus bersama: `src/components/DeleteConfirmation.tsx` (baru), `src/components/ui/alert-dialog.tsx`, `src/components/TxRow.tsx`, `src/components/CategoryManager.tsx`, `src/routes/_authenticated/dompet.tsx`, `src/routes/_authenticated/admin.tsx`.
  - Profil hasil remix yang belum terbentuk dipulihkan, izin baca/ubah profil diberikan tanpa membuka akses publik, trigger signup dipertahankan: `drizzle/migrations/0001_restore_profile_access_and_signup_trigger.sql`.
  - Nama/foto memakai status proses dan hasil tersimpan; kegagalan baca profil/foto tidak disembunyikan: `src/routes/_authenticated/profil.tsx`, `src/lib/data.ts`.
  - Tes nama tersimpan, error profil/foto/sesi, pembatalan hapus, menunggu proses hapus, dan gagal hapus: `src/test/profile.test.ts`, `src/test/delete-confirmation.test.tsx`.
  - Nama dan foto diuji lewat halaman Profil dengan akun masuk dan muat ulang; nama serta foto asli dikembalikan setelah pengujian. Perubahan email/password tidak dijalankan agar akun asli tidak berubah; alur konfirmasi email tetap diperlukan.
  - Metadata halaman dilengkapi pada `src/routes/index.tsx`, `src/routes/auth.tsx`, dan halaman di `src/routes/_authenticated/{dashboard,catat,riwayat,dompet,laporan,profil,admin}.tsx`; tanpa perubahan fitur Batch 3.
  - Aturan struktur dicatat di `AGENTS.md`; daftar revisi di `roadmap.md`.
- **2026-10-08 — Batch 1 selesai (1.1–1.5)**
  - 1.1 Card dompet responsif (truncate nama, saldo wrap, tombol aksi menumpuk di layar sempit): `src/routes/_authenticated/dompet.tsx`
  - 1.2 Semua emoji diganti icon Lucide (tipe dompet, kategori, status admin, landing, sapaan, lampiran): `src/lib/icons.ts` (baru), `src/lib/data.ts`, `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/admin.tsx`, `src/routes/index.tsx`, `src/components/TxRow.tsx`, `src/routes/_authenticated/catat.tsx`
  - 1.3 Avatar profil di pojok kanan atas (mobile & desktop), fallback inisial: `src/components/AppShell.tsx`
  - 1.4 Pemilih dompet berupa kartu ber-icon & bersaldo di form Catat: `src/components/WalletPicker.tsx` (baru), `src/routes/_authenticated/catat.tsx`
  - 1.5 Filter dompet Riwayat berupa chip ber-icon yang bisa digeser: `src/components/WalletPicker.tsx`, `src/routes/_authenticated/riwayat.tsx`
- **2026-10-08 — Perbaikan setelah Batch 1**
  - Jendela Tambah/Ubah Dompet tidak lagi melebar keluar layar di Android: `src/components/ui/dialog.tsx`, `src/components/Keypad.tsx`, `src/routes/_authenticated/dompet.tsx`
  - Trigger `on_auth_user_created` dipasang kembali (hilang setelah remix) + profil/role/dompet Tunai dibuat untuk akun yang sudah ada: `drizzle/migrations/0000_restore_new_user_trigger.sql`
  - Profil: nama & foto otomatis dari akun Google, simpan nama/foto kini menampilkan error jika gagal: `src/routes/_authenticated/profil.tsx`
- **2026-10-08 — Batch 2 selesai (2.1–2.4)**
  - 2.1 Tombol "Ubah" di detail transaksi: edit nominal, dompet, kategori, rincian, waktu; saldo dompet otomatis dihitung ulang: `src/components/TxEditDialog.tsx` (baru), `src/components/TxRow.tsx`
  - 2.2 Kelola kategori kustom (tambah/ubah/hapus, kategori bawaan terkunci) dari form Catat & form Ubah; hapus kategori tidak menghapus transaksi (kategori jadi kosong): `src/components/CategoryManager.tsx` (baru), `src/routes/_authenticated/catat.tsx`, `drizzle/migrations/0000_category_delete_set_null.sql`
  - 2.3 Header per hari ("Hari ini", "Kemarin", tanggal) di Beranda & Riwayat: `src/components/TxList.tsx` (baru), `src/lib/tx.ts`
  - 2.4 Pagination 10 transaksi/halaman (filter di server) di Beranda & Riwayat: `src/lib/tx.ts`, `src/components/TxList.tsx`, `src/routes/_authenticated/dashboard.tsx`, `src/routes/_authenticated/riwayat.tsx`, tes `src/test/tx.test.ts`
