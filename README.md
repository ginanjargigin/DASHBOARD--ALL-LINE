# Papan Produksi — Dashboard Monitoring Line

Web app pengganti papan tulis manual. Menampilkan status tiap line produksi
(gap plan vs aktual produksi, OT standar vs OT aktual, sales) dalam bentuk
papan yang bisa ditampilkan di TV/monitor, plus form input harian dan
riwayat/tren per line.

## Tentang privasi data (PENTING — baca dulu)

Aplikasi ini **tidak punya database server/cloud sama sekali**. Semua data
(daftar line + input harian) disimpan di `localStorage` browser perangkat
yang membukanya:

- Dibuka di laptop → data tersimpan di laptop itu.
- Dibuka di HP → data tersimpan di HP itu.

Konsekuensinya: data **tidak otomatis sinkron** antar perangkat, karena
memang tidak dikirim ke mana-mana. Kalau perlu pindah data dari laptop ke HP
(atau sebaliknya), atau cadangan, pakai menu **Kelola Line → Ekspor/Impor
data (.json)**.

Kalau nanti butuh semua perangkat lihat data yang sama secara real-time
(misal TV di lantai produksi + HP admin input dari lokasi lain), itu perlu
database terpusat (bukan lagi murni localStorage) — beri tahu saya kalau mau
dikembangkan ke arah situ.

## Menjalankan di komputer sendiri (sebelum deploy)

Butuh [Node.js](https://nodejs.org) versi 18 ke atas terpasang.

```bash
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Struktur halaman

- `/` — Papan TV: grid semua line dengan status (kritis/perlu evaluasi/aman),
  perbandingan plan vs aktual produksi, plan vs aktual OT, dan rekomendasi
  layak-tidaknya lembur weekend.
- `/input` — Form input data harian per line (plan produksi, actual sales,
  produksi per shift, OT plan/aktual, delivery, catatan).
- `/lines` — Tambah/ubah nama/hapus line, ekspor/impor data.
- `/line/[id]` — Detail satu line: tren 14 hari terakhir + tabel riwayat
  lengkap.

## Cara kerja deteksi masalah

Logika ada di `lib/calc.js`. Status line dihitung dari rata-rata 7 hari
data terakhir:

- **Kritis**: OT aktual rata-rata ≥ 2 jam di atas plan, ATAU produksi aktual
  ≥ 12% di bawah plan.
- **Perlu evaluasi**: OT aktual ≥ 1 jam di atas plan, ATAU produksi ≥ 5% di
  bawah plan.
- **Aman**: di luar kondisi di atas.

Angka-angka ambang batas ini cuma titik awal — gampang diubah di
`THRESHOLDS` pada `lib/calc.js` sesuai kebiasaan pabrik.

## Deploy: GitHub → Vercel

1. **Buat repo di GitHub**
   - Buka github.com → New repository → beri nama (mis. `dashboard-line`) →
     jangan centang "Add README" (karena sudah ada) → Create repository.

2. **Push project ini ke repo tersebut** (jalankan dari folder project ini):
   ```bash
   git init
   git add .
   git commit -m "Initial commit: papan produksi dashboard"
   git branch -M main
   git remote add origin https://github.com/USERNAME/dashboard-line.git
   git push -u origin main
   ```
   Ganti `USERNAME` dan nama repo sesuai punya Anda.

3. **Deploy ke Vercel**
   - Buka [vercel.com](https://vercel.com) → login (bisa pakai akun GitHub).
   - Klik **Add New → Project**.
   - Pilih repo `dashboard-line` yang baru di-push.
   - Framework Preset otomatis terdeteksi **Next.js** — tidak perlu ubah apa-apa.
   - Klik **Deploy**. Tunggu ± 1 menit.
   - Setelah selesai, Vercel kasih URL publik (mis. `dashboard-line.vercel.app`).

4. **Update selanjutnya**: setiap kali `git push` ke branch `main`, Vercel
   otomatis build ulang dan deploy versi terbaru.

### Menampilkan di TV/monitor

Buka URL Vercel tersebut di browser TV/monitor (atau di laptop yang
disambungkan ke TV via HDMI), lalu gunakan mode fullscreen browser (F11 di
Chrome/Edge). Halaman `/` akan menampilkan grid status semua line dan
otomatis refresh tampilan jam setiap 30 detik.

Catatan: karena data localStorage sifatnya per-perangkat, input data harian
sebaiknya dilakukan dari perangkat yang sama dengan yang dipakai untuk
menampilkan papan TV — atau ekspor data dari perangkat input lalu impor ke
perangkat TV secara berkala.
