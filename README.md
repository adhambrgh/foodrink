# Foodrink

Web pemesanan jajanan kelas (pisang nugget & es maboo). Siswa pesan dari HP,
bayar QRIS (Midtrans) atau tunai, pesanan diantar ke ruangan. Admin mengatur
produk, stok, tag, dan status pesanan dari panel `/admin`.

Stack: Laravel 12, Blade, PostgreSQL (Supabase), Vite, Midtrans Snap.

## Setup Lokal

```powershell
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm run build
php artisan serve
```

Isi `.env` sesuai kredensial lokal. Untuk Supabase, ambil host/port/user dari
Dashboard Supabase (Settings → Database). Pakai **transaction pooler (port 6543)**
untuk koneksi serverless.

Admin default dari seeder: `ADMIN_EMAIL` / `ADMIN_PASSWORD` di `.env`
(bawaan `admin@foodrink.test` / `rahasia123`). **Ganti setelah login.**

## Midtrans

1. Daftar di [Midtrans](https://midtrans.com), ambil Server Key & Client Key
   (sandbox dulu).
2. Isi `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION=false`.
3. Di Dashboard Midtrans, set **Payment Notification URL** ke
   `https://<domain>/checkout/callback`.
4. Naik produksi: ganti key ke kunci produksi dan set
   `MIDTRANS_IS_PRODUCTION=true`.

Webhook `/checkout/callback` sengaja di luar CSRF (server Midtrans tidak
mengirim token) dan keamanannya lewat verifikasi `signature_key`.

## Deploy ke Vercel

Laravel jalan di Vercel lewat runtime `vercel-php` (lihat `vercel.json` dan
entrypoint `api/index.php`). Front-end di-serve dari `public/**`.

### 1. Sebelum push

```powershell
npm run build
php artisan test
```

`public/build` ikut ter-commit. Jalankan `npm run build` setiap kali
CSS/JS berubah.

### 2. Import proyek di Vercel

- Framework Preset: **Other**
- Build Command: `npm run build`
- Output Directory: kosongkan (diatur `vercel.json`)
- Install Command: default

### 3. Environment Variables

Isi di Vercel (Production & Preview):

```ini
APP_NAME=Foodrink
APP_ENV=production
APP_KEY=<php artisan key:generate --show>
APP_DEBUG=false
APP_URL=https://<domain>
APP_TIMEZONE=Asia/Jakarta
APP_LOCALE=id

DB_CONNECTION=pgsql
DB_HOST=<transaction pooler Supabase>
DB_PORT=6543
DB_DATABASE=postgres
DB_USERNAME=postgres.<ref>
DB_PASSWORD=<...>
DB_SSLMODE=require

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr

# Sistem berkas Vercel read-only; cache & view diarahkan ke /tmp.
VIEW_COMPILED_PATH=/tmp/views
APP_CONFIG_CACHE=/tmp/config.php
APP_PACKAGES_CACHE=/tmp/packages.php
APP_ROUTES_CACHE=/tmp/routes.php
APP_SERVICES_CACHE=/tmp/services.php

# Gambar disimpan di Supabase Storage (disk s3).
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=<supabase s3 access key>
AWS_SECRET_ACCESS_KEY=<supabase s3 secret>
AWS_DEFAULT_REGION=<region>
AWS_BUCKET=produk
AWS_ENDPOINT=https://<ref>.supabase.co/storage/v1/s3
AWS_URL=https://<ref>.supabase.co/storage/v1/object/public/produk
AWS_USE_PATH_STYLE_ENDPOINT=true

MIDTRANS_SERVER_KEY=<...>
MIDTRANS_CLIENT_KEY=<...>
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_BATAS_BAYAR_MENIT=30

CRON_SECRET=<string-acak>
```

### 4. Migrasi database

Vercel serverless tidak punya shell. Jalankan migrasi **dari lokal**,
arahkan `.env` ke database produksi:

```powershell
php artisan migrate --force
```

### 5. Cron

`vercel.json` menjadwalkan `/cron/orders-expire` (sekali sehari) untuk
menghapus pesanan QRIS yang tak pernah dibayar. Vercel mengirim header
`Authorization: Bearer <CRON_SECRET>` otomatis bila `CRON_SECRET` diset.
Di server non-Vercel, jadwalkan `php artisan orders:expire` via cron biasa.