# Foodrink — Sistem Pemesanan Pisang Nugget & Es Maboo

Tanggal: 2026-09-29
Status: Disetujui
Stack: Laravel 12, PHP 8.4, MySQL 8 (Laragon lokal)

---

## 1. Ringkasan

Web mobile-first untuk jualan pisang nugget dan es maboo ke siswa sekolah.
Pelanggan melihat katalog, memesan, dan membayar via QRIS atau tunai. Pesanan
bisa diantar ke kelas atau diambil sendiri. Admin mengelola produk dan memantau
pesanan lewat dashboard web.

Target pengguna: siswa SMP/SMA, mayoritas diakses dari HP.

## 2. Keputusan Arsitektur

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Framework | Laravel 12 | Diminta pemilik; ekosistem auth, upload, dan webhook sudah matang |
| Database | MySQL 8 via Laragon | Diminta pemilik; tersedia lokal, root tanpa password |
| Hosting (saat ini) | Laragon lokal | Dipilih pemilik untuk tahap awal; perlu PC menyala & jaringan lokal |
| Hosting (nanti) | Shared hosting cPanel | Deploy Laravel + MySQL, migrasi saat siap |
| Payment | Midtrans Snap (QRIS dinamis) | Diminta pemilik; QRIS per transaksi, verifikasi otomatis |
| Image storage | `storage/app/public` (lokal) | Shared hosting murah umumnya tidak mendukung S3 |
| Admin auth | `users` table, email + password | Satu akun saja; tidak perlu tabel role/permission |

### Batasan tahap ini

Aplikasi dijalankan di `http://foodrink.test` lewat Laragon. Tidak ada domain
publik, tidak ada SSL, tidak ada multi-server. Fungsi sharing ke siswa di luar
jaringan sekolah belum tersedia — itu urusan tahap hosting berikutnya.

### Prasyarat Midtrans

Kode ditulis agar berjalan dalam **mode simulasi** tanpa akun merchant. Untuk
mode produksi, Midtrans Snap memerlukan:

- Akun merchant Midtrans terverifikasi
- 3 environment variable: `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
  `MIDTRANS_PRODUCTION=false`

Saat ini ketiga variabel itu kosong dan aplikasi berjalan di mode simulasi.
Transaksi simulasi tidak benar-benar memindahkan uang.

## 3. Model Data

### 3.1 `products`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `nama` | string(120) | Nama produk, wajib |
| `slug` | string(140) unique | URL-friendly, auto-generated dari `nama` |
| `deskripsi` | text nullable | Deskripsi singkat, opsional |
| `harga` | integer | Dalam Rupiah penuh, tanpa titik. Contoh: `12000` |
| `kategori` | string(20) | `pisang_nugget` atau `es_maboo` |
| `gambar` | string nullable | Path relatif di `storage/app/public`, mis. `products/abc.jpg` |
| `tersedia` | boolean default true | `false` = tampil tapi tombol pesan nonaktif |
| `urutan` | integer default 0 | Ascending. Tied diurutkan `nama` |
| `timestamps` | | |

Nilai `kategori` dienum di level aplikasi (`App\Enums\Kategori`), tidak ada
tabel terpisah. Asumsinya dua kategori dan tidak berubah sering.

### 3.2 `orders`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `kode` | string(12) unique | Kode unik yang dilihat pengguna, mis. `FR-8K2M4Q7` |
| `nama` | string(120) | Nama pemesan |
| `kelas` | string(30) | Wajib bila `cara_ambil = antar` |
| `no_wa` | string(25) | Nomor WhatsApp tanpa `+` |
| `cara_ambil` | string(10) | `antar` atau `ambil` |
| `metode_bayar` | string(10) | `qris` atau `tunai` |
| `status` | string(20) | Lihat 3.3 |
| `total` | integer | Total akhir dalam Rupiah |
| `midtrans_order_id` | string(100) nullable | ID transaksi dari Midtrans |
| `snap_token` | text nullable | Token untuk membuka popup Snap |
| `batas_bayar` | timestamp nullable | Waktu jatuh tempo bayar (default now + 15 menit). Hanya diisi untuk metode `qris` |
| `timestamps` | | |

### 3.3 `order_items`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | bigint PK | |
| `order_id` | FK → orders, cascade delete | |
| `product_id` | FK → products, restrict delete | |
| `nama` | string(120) | Salinan nama saat order dibuat |
| `harga` | integer | Salinan harga saat order dibuat |
| `jumlah` | integer unsigned | Minimal 1 |
| `subtotal` | integer | `harga * jumlah`, disimpan agar historis tidak berubah |

Menyalin `nama` dan `harga` ke `order_items` disengaja: harga produk boleh naik
sewaktu-waktu, tapi pesanan lama harus tetap menunjukkan harga yang benar-benar
dibayar.

### 3.4 Enum `StatusOrder`

| Nilai | Arti | Transisi berikutnya |
|---|---|---|
| `menunggu_bayar` | Order QRIS dibuat, menunggu pembayaran | `lunas`, `kedaluwarsa` |
| `lunas` | Sudah dibayar, belum diterima admin | `dibuat`, `batal` |
| `dibuat` | Diterima admin, siap diantar atau diambil | `selesai`, `batal` |
| `selesai` | Sudah diantar / diambil | — terminal |
| `batal` | Dibatalkan | — terminal |
| `kedaluwarsa` | Lewat `batas_bayar` tanpa bayar | — terminal |

Dua jalur berbeda di awal, bertemu di `dibuat`:

- **QRIS** — `menunggu_bayar` → (webhook) → `lunas` → (terima admin) → `dibuat`
- **Tunai** — langsung `dibuat` saat order dibuat, tanpa lewat `lunas` dan tanpa
  `menunggu_bayar`, karena tidak ada konfirmasi pembayaran dari sistem

`lunas` hanya bisa dicapai oleh order QRIS. Admin menekan **Tandai Lunas** untuk
order tunai apa pun agar bisa mencatat kapan uang diterima, tetapi status
order-nya sudah `dibuat` — jadi aksi itu tidak dipakai untuk tunai.

Setelah `dibuat`, admin menekan **Tandai Selesai** ketika barang sudah diantar ke
kelas atau diambil pelanggan.

## 4. Rute

### Publik (tanpa login)

| Method | URI | Nama | Fungsi |
|---|---|---|---|
| GET | `/` | `katalog` | Daftar produk, dikelompokkan per kategori |
| POST | `/keranjang/tambah` | `keranjang.tambah` | Tambah produk ke keranjang |
| PATCH | `/keranjang/{produk}` | `keranjang.update` | Ubah jumlah |
| DELETE | `/keranjang/{produk}` | `keranjang.hapus` | Hapus item |
| GET | `/keranjang` | `keranjang.show` | Halaman keranjang |
| GET | `/pesan` | `checkout` | Form data pemesan + pilih metode bayar |
| POST | `/pesan` | `checkout.store` | Buat order, arahkan ke bayar atau status |
| GET | `/pesanan/{kode}` | `pesanan.show` | Status pesanan (polling) |
| POST | `/api/pembayaran/cek` | `api.bayar.cek` | Midtrans notification handler |

### Admin (butuh login)

| Method | URI | Nama | Fungsi |
|---|---|---|---|
| GET | `/admin/login` | `admin.login` | Form login |
| POST | `/admin/login` | `admin.login.store` | Proses login |
| POST | `/admin/logout` | `admin.logout` | Keluar |
| GET | `/admin` | `admin.dashboard` | Ringkasan hari ini |
| GET | `/admin/produk` | `admin.produk.index` | Daftar produk |
| GET | `/admin/produk/tambah` | `admin.produk.create` | Form tambah |
| POST | `/admin/produk` | `admin.produk.store` | Simpan produk baru |
| GET | `/admin/produk/{produk}/ubah` | `admin.produk.edit` | Form edit |
| PUT | `/admin/produk/{produk}` | `admin.produk.update` | Simpan perubahan |
| DELETE | `/admin/produk/{produk}` | `admin.produk.destroy` | Hapus produk |
| PATCH | `/admin/produk/{produk}/tersedia` | `admin.produk.toggle` | Toggle ketersediaan (AJAX) |
| GET | `/admin/pesanan` | `admin.pesanan.index` | Daftar + filter status |
| GET | `/admin/pesanan/{order}` | `admin.pesanan.show` | Detail + aksi |
| PATCH | `/admin/pesanan/{order}/status` | `admin.pesanan.status` | Ubah status |
| GET | `/admin/pesanan/{order}/snap` | `admin.pesanan.snap` | Buka ulang popup Snap untuk QRIS yang belum dibayar |

### Product Images

| Method | URI | Nama |
|---|---|---|
| GET | `/storage/products/{gambar}` | symlink dari `php artisan storage:link` |

Gambar disimpan di `storage/app/public/products/`, diakses lewat symlink
`public/storage`. Penamaan file di-generate acak (`Str::random(20).$ext`) untuk
mencegah tabrakan nama dan menjaga URL tetap valid meski nama produk berubah.

## 5. Alur Pemesanan

```
Katalog ──[+]──> Keranjang ──[Lanjut]──> Form
                                        │
                        ┌───────────────┴───────────────┐
                      QRIS                             TUNAI
                        │                               │
              Order = menunggu_bayar           Order = dibuat
              Buat transaksi Snap                     │
                        │                      Pelanggan tunjukkan
              Tampilkan popup Snap                  halaman ke kasir
                        │                               │
                Pelanggan scan & bayar                │
                        │                      Admin terima uang
              Webhook Midtrans masuk                  │
                        │                      Admin tekan "Lunas"
                        │                               │
                  status=lunas ◄────────────────────────┘
                        │
              Halaman status (polling 5 detik)
                        │
                  status=selesai
```

Kedua jalur bertemu di `lunas`, lalu admin menandai `selesai` setelah barang
diantar atau diambil.

### 5.1 Aturan validasi

- `nama`: wajib, min 2 karakter
- `kelas`: wajib bila `cara_ambil = antar`; opsional (boleh kosong) bila `ambil`
- `no_wa`: wajib, angka saja setelah normalisasi, 9–15 digit
- Keranjang tidak boleh kosong
- Produk yang diorder harus `tersedia = true` **pada saat order dibuat**. Kalau
  produk menjadi `tersedia = false` setelah masuk keranjang, item tersebut
  ditolak dan pengguna diberi tahu item mana yang bermasalah.
- Minimal 1 item per order

### 5.2 Normalisasi

`no_wa` dibersihkan sebelum disimpan: hapus semua karakter non-digit, hapus
awalan `0` lalu simpan sebagai format `62xxx`. Tampilan di halaman admin
mem-format ulang ke `08xx-xxxx-xxxx`.

### 5.3 Anti-spam

Rate limit `throttle:6,1` pada `POST /pesan` (6 order per menit per IP). Ini
mencegah form di-submit berulang tanpa memblokir pembelian sah.

### 5.4 Pemrosesan pembayaran

**QRIS:**
1. `OrderService::createOrder()` menyimpan order dengan `status = menunggu_bayar`
2. `MidtransService::createTransaction()` mengirim payload ke Snap API
3. Respons `token` disimpan di `snap_token`, `order_id` Midtrans disimpan di
   `midtrans_order_id`
4. Controller mengembalikan `snap_token` ke frontend
5. Frontend memanggil `window.snap.pay(token, callbacks)`
6. Redirect ke `/pesanan/{kode}`

**Webhook Midtrans** (`POST /api/pembayaran/cek`):
1. Verifikasi signature hash dengan `MidtransService::isValidSignature()`
2. Cari order berdasarkan `order_id`
3. Jika `transaction_status = settlement` atau `capture`, set `status = lunas`
4. Jika `transaction_status = expire` atau `pending` melewati `batas_bayar`, set
   `status = kedaluwarsa`
5. Selalu balas HTTP 200 dengan JSON `{success: true}`, termasuk saat order tidak
   ditemukan — supaya Midtrans tidak retry

**Mode simulasi** (`MIDTRANS_PRODUCTION=false` tanpa `MIDTRANS_SERVER_KEY`):
`MidtransService` mengembalikan `snap_token` dummy dan status order tidak akan
berubah otomatis. Halaman status menampilkan tombol simulasi "Tandai lunas"
khusus di environment lokal untuk bisa menguji alur.

**Tunai:**
1. Order dibuat langsung dengan `status = dibuat`, tanpa memanggil Midtrans sama
   sekali dan `batas_bayar` diisi `null`
2. Halaman status menampilkan instruksi "Tunjukkan halaman ini ke kasir saat
   ambil"
3. Admin menekan **Tandai Lunas** setelah menerima uang, lalu **Selesai** setelah
   barang diantar atau diambil

Tidak ada QRIS untuk metode tunai. Pelanggan yang sudah scan QRIS akan masuk ke
alur QRIS, bukan tunai — jadi tidak perlu QRIS kedua di halaman kasir.

### 5.5 Status pesanan

Halaman `/pesanan/{kode}` mengambil status lewat polling:

```
GET /pesanan/{kode}/status → { "status": "lunas", "label": "..." }
```

Polling berhenti otomatis saat status masuk terminal (`selesai`, `batal`,
`kedaluwarsa`) atau setelah 10 menit. `no-store` header mencegah cache.

Halaman status tidak membutuhkan login. `kode` bersifat acak (6 karakter dari
alphabet tanpa karakter ambigu: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, prefix `FR-`).
Ini bukan mekanisme keamanan kuat, hanya untuk mencegah tebakan sederhana.

## 6. Admin

### 6.1 Authentication

Guard `web`, tabel `users` bawaan Laravel. Satu user, dibuat lewat seeder atau
Tinker. Password minimal 8 karakter, di-hash dengan bcrypt (default Laravel).

Semua route `/admin/*` memakai middleware `auth` + prefix `admin`. Redirect ke
`/admin/login` kalau belum login.

### 6.2 Dashboard

- Total pesanan hari ini
- Omzet hari ini (`SUM(total)` dari order yang `status IN (lunas, dibuat, selesai)`)
- Jumlah per status
- 10 pesanan terbaru dengan kode, nama, kelas, status

### 6.3 Manajemen produk

- **Daftar:** tabel dengan thumbnail, nama, kategori, harga, toggle tersedia,
  tombol edit/hapus
- **Tambah/Edit:** field nama, harga, kategori, deskripsi, upload gambar,
  checkbox tersedia, urutan
- **Upload:** `max:2MB`, hanya `jpg/jpeg/png/webp`. Divalidasi di level
  controller. Dikompres ke lebar maksimal 1200px dengan GD atau Imagick,
  quality 82, lalu disimpan sebagai WebP
- **Hapus:** konfirmasi di frontend, cascade delete `order_items` via FK. Produk
  yang pernah dipesan **tidak dihapus** — ditolak dengan pesan "Produk ini sudah
  pernah dipesan, nonaktifkan saja" agar historis tetap utuh
- **Toggle tersedia:** PATCH via fetch, tanpa reload halaman

### 6.4 Manajemen pesanan

- **Daftar:** tabel dengan filter status lewat query `?status=`. Tab: **Perlu
  Diproses** (`dibuat` + `lunas`, default) / Menunggu Bayar / Selesai /
  Kedaluwarsa / Batal / Semua. Nilai multi dipisah koma, mis.
  `?status=dibuat,lunas`
- **Pengelompokan antrean:** agar mudah dipilah saat jam sibuk, daftar diurutkan
  `dibuat` dulu (siap diantar), lalu `lunas`, lalu sisanya by `created_at` desc.
  Setiap baris menampilkan badge kelas yang menonjol supaya admin bisa memindai
  daftar dengan mata saja — ini alasan utama `cara_ambil` + `kelas` disimpan
- **Detail:** data pemesan, item, total, metode bayar, status. Tombol yang
  muncul tergantung status saat ini:

  | Status sekarang | Tombol |
  |---|---|
  | `menunggu_bayar` (QRIS) | **Buka Pembayaran Lagi**, **Tandai Lunas** (jika webhook gagal), **Batalkan** |
  | `lunas` (QRIS) | **Terima Pesanan** (`lunas` → `dibuat`), **Batalkan** |
  | `dibuat` (tunai & QRIS) | **Tandai Selesai**, **Batalkan** |
  | status terminal | tidak ada aksi |

- **Aksi status** diverifikasi terhadap transisi yang valid di `StatusOrder`.
  Transisi tak valid mengembalikan 422 dengan pesan jelas, bukan diam-diam gagal

### 6.5 Ringkasan responsif

Admin tetap mobile-friendly karena admin sering buka dari HP. Tabel pada layar
kecil berubah jadi kartu bertumpuk (CSS-only, tanpa JS).

## 7. Desain Visual

Arah: **warm craft / edarik**. Terlihat seperti papan dagang yang dicetak,
bukan startup.

### 7.1 Token

**Warna**

| Token | Hex | Pakai |
|---|---|---|
| `--kertas` | `#F5EFE3` | Background utama |
| `--kertas-tua` | `#EBE2D0` | Background sekunder (strip, footer) |
| `--tinta` | `#2A2118` | Teks utama |
| `--tinta-lunak` | `#6B5D4D` | Teks sekunder |
| `--bata` | `#C8442E` | Aksen utama, CTA, harga |
| `--kunyit` | `#E8A33D` | Aksen sekunder, badge kategori |
| `--hijau` | `#4A7C4E` | Sukses, status lunas |
| `--garis` | `#D9CDB8` | Garis pemisah |

**Tipografi**

- Judul & harga: **Fraunces** (variable serif, `wght 600`, `opsz` 48,
  `SOFT` 0, `WONK` 1). Dimuat dari Google Fonts.
- Body & UI: **Plus Jakarta Sans** (400/500/600/700)
- Fallback: `Georgia, serif` dan `system-ui, sans-serif`

Kedua font dimuat lewat `fonts.bunny.net` atau Google Fonts dengan
`preconnect`. `font-display: swap`.

**Skala tipografi** (mobile-first, `clamp()` untuk fluid)

| Token | Nilai | Pakai |
|---|---|---|
| `--text-display` | `clamp(2rem, 8vw, 3.5rem)` | Judul utama katalog |
| `--text-h1` | `clamp(1.5rem, 5vw, 2rem)` | Nama section |
| `--text-h2` | `1.25rem` | Nama produk |
| `--text-body` | `1rem` | Teks biasa |
| `--text-sm` | `0.875rem` | Deskripsi, meta |
| `--text-xs` | `0.75rem` | Badge, label |

**Spacing** — skala 4px: `4, 8, 12, 16, 24, 32, 48, 64, 96`

**Radius** — hanya 3 nilai: `4px` (input, badge), `8px` (tombol, container
kecil), `999px` (badge bulat, avatar). Tidak ada `rounded-3xl` dan sejenisnya.

**Bayangan** — satu saja: `0 1px 2px rgb(42 33 24 / 0.06)`. Tanpa
`shadow-lg`, tanpa `drop-shadow-xl`.

### 7.2 Layout katalog

```
┌──────────────────────────────┐
│  Foodrink                    │  ← header sticky, tinggi 56px,
│  jajanan kelas ▾              │    blur ringan + garis bawah
├──────────────────────────────┤
│                              │
│  Pisang Nugget               │  ← Fraunces 32px, tinta
│                              │
│  ┌────┬──────────────────┐   │
│  │▨▨▨ │ Pisang Nugget     │   │  ← foto 96×96, radius 4px,
│  │▨▨▨ │ Original         │   │    foto punya border 3px bata
│  └────┴──────────[ + ]───┘   │
│  ────────────────────────    │  ← garis 1px, bukan card
│  ┌────┬──────────────────┐   │
│  │▨▨▨ │ Pisang Nugget     │   │
│  │▨▨▨ │ Coklat Keju      │   │
│  └────┴──────────[ + ]───┘   │
│                              │
│  Es Maboo                    │
│  ┌────┬──────────────────┐   │
│  │▨▨▨ │ Es Maboo Original│   │
│  │▨▨▨ │ ─── 8.000        │   │  ← harga: Fraunces, tabular nums
│  └────┴──────────[ + ]───┘   │
├──────────────────────────────┤
│  🛒 2 item        Rp 24.000 │  ← sticky bottom bar, muncul
│  [                 Lanjut ] │    hanya kalau keranjang ada isi
└──────────────────────────────┘
```

Baris produk: `display: grid; grid-template-columns: 96px 1fr auto; gap: 16px;`
dengan `align-items: center`. Harga di bawah nama, warna bata.
Tombol `+` diameter 40px, `border-radius: 999px`, border 1.5px tinta,
transparan — bukan solid warna.

### 7.3 Tekstur kertas

Background `body` memakai `radial-gradient` sangat halus plus SVG noise:

```css
background-color: #F5EFE3;
background-image:
  radial-gradient(circle at 20% 10%, rgb(232 163 61 / 0.06), transparent 40%),
  url("data:image/svg+xml,...feTurbulence...");
background-attachment: fixed;
```

Noise di-generate sebagai inline SVG data URI, `opacity` inherent ~2–3%.
Disimpan sebagai partial Blade (`resources/views/partials/paper-grain.blade.php`).

### 7.4 Ikon

SVG inline, `stroke-width: 1.75`, `currentColor`, ukuran 20–24px. Set yang
dibutuhkan: keranjang, plus, minus, cek, silang, chevron, lokasi, dompet, trash,
edit, search. Tidak ada emoji sebagai ikon.

### 7.5 Gerak

Hanya dua animasi:

1. **Masuk katalog** — kartu produk `opacity 0→1` + `translateY 8px→0`,
   `200ms ease-out`, stagger 30ms per item (maks 6 item agar tidak lambat)
2. **Keranjang** — badge jumlah di header `scale 1→1.15→1` `150ms` saat
   bertambah

Keduanya diimplementasikan dengan CSS transition + IntersectionObserver, bukan
library. `@media (prefers-reduced-motion: reduce)` menonaktifkan keduanya
serta `scroll-behavior: auto`.

### 7.6 Prinsip yang dihindari

| Dilarang | Kenapa |
|---|---|
| Font Inter | Terlalu sering jadi default AI; terasa generik |
| Gradient ungu/pink | Tanda desain generik 2023–2024 |
| Glassmorphism | Tidak sesuai nuansa kertas |
| Emoji sebagai ikon | Terlihat tidak serius untuk transaksi |
| Card rounded penuh dengan shadow | Terlalu banyak, produk jadi seperti marketplace |
| Dark mode | Tidak perlu untuk katalog makanan; menambah upkeep |
| Animasi parallax/scroll-jacking | Berat di HP murah, tidak perlu |
| Skeleton loader | Data produk kecil, tidak perlu |

## 8. Struktur Direktori

```
app/
├── Enums/
│   ├── Kategori.php            # enum: PISA_NUGGET, ES_MABOO
│   └── StatusOrder.php         # enum + allowedTransitions()
├── Http/
│   ├── Controllers/
│   │   ├── KatalogController.php
│   │   ├── KeranjangController.php
│   │   ├── CheckoutController.php
│   │   ├── PesananController.php
│   │   ├── PaymentNotificationController.php
│   │   └── Admin/
│   │       ├── AuthController.php
│   │       ├── DashboardController.php
│   │       ├── ProdukController.php
│   │       └── PesananController.php
│   ├── Middleware/
│   │   └── EnsureAdmin.php
│   └── Requests/
│       ├── StoreCheckoutRequest.php
│       └── StoreProductRequest.php
├── Models/
│   ├── Product.php
│   ├── Order.php
│   └── OrderItem.php
├── Services/
│   ├── OrderService.php        # buat order, hitung total
│   ├── CartService.php         # baca/tulis keranjang di session
│   ├── MidtransService.php     # wrapper Snap API + verifikasi signature
│   └── ImageService.php        # kompres & simpan upload
└── Support/
    └── KodePesanan.php         # generator kode acak
resources/views/
├── layouts/
│   ├── shop.blade.php
│   └── admin.blade.php
├── partials/
│   ├── paper-grain.blade.php
│   ├── icon.blade.php          # <x-icon name="keranjang" />
│   ├── product-row.blade.php
│   └── flash.blade.php
├── shop/
│   ├── katalog.blade.php
│   ├── keranjang.blade.php
│   ├── checkout.blade.php
│   └── pesanan.blade.php
└── admin/
    ├── login.blade.php
    ├── dashboard.blade.php
    ├── produk/{index,create,edit}.blade.php
    └── pesanan/{index,show}.blade.php
database/migrations/
├── 2026_01_01_000001_create_products_table.php
├── 2026_01_01_000002_create_orders_table.php
└── 2026_01_01_000003_create_order_items_table.php
database/seeders/
├── AdminUserSeeder.php
└── ProdukSeeder.php
config/
└── midtrans.php
tests/Feature/
├── KatalogTest.php
├── CheckoutTest.php
├── PaymentNotificationTest.php
├── AdminAuthTest.php
├── AdminProdukTest.php
└── AdminPesananTest.php
```

Kolom `kategori` sudah ada di `create_products_table` — tidak perlu migrasi
tambahan. Data awal (produk contoh & akun admin) di-*seed*, bukan migrasi.

`config/midtrans.php` membaca dari `.env`:

```php
$sandbox = ! env('MIDTRANS_PRODUCTION', false);

return [
    'server_key'       => env('MIDTRANS_SERVER_KEY'),
    'client_key'       => env('MIDTRANS_CLIENT_KEY'),
    'production'       => ! $sandbox,
    'snap_token_url'   => $sandbox
        ? 'https://app.sandbox.midtrans.com/snap/v2/transactions'
        : 'https://app.midtrans.com/snap/v2/transactions',
    'api_base_url'     => $sandbox
        ? 'https://api.sandbox.midtrans.com/v2'
        : 'https://api.midtrans.com/v2',
    'webhook_hash_key' => env('MIDTRANS_WEBHOOK_HASH_KEY', env('MIDTRANS_SERVER_KEY')),
];
```

`api_base_url` dipakai untuk endpoint status transaksi
(`{base}/{orderId}/status`) di `MidtransService`. Base URL disimpan di config,
ID ditambahkan saat request — bukan di file config.

## 9. Penanganan Error

| Situasi | Perilaku |
|---|---|
| Keranjang kosong saat buka `/keranjang` | Redirect ke `/` dengan flash "Keranjang masih kosong" |
| Produk `tersedia = false` saat checkout | 422 + pesan nama produk yang bermasalah, redirect balik ke keranjang |
| Stok habis (produk dihapus admin) saat checkout | 422 + pesan "Ada produk yang sudah tidak tersedia" |
| Order tidak ditemukan di webhook | HTTP 200 + `{success:true}` agar Midtrans tidak retry |
| Signature webhook tidak valid | HTTP 403 + log, tidak ada perubahan state |
| Gagal kompres gambar | 422 dengan pesan "Gagal memproses gambar, coba file lain" |
| Upload bukan gambar / > 2MB | 422 dengan pesan spesifik |
| Admin belum login akses `/admin/*` | Redirect ke `/admin/login` |
| Transisi status tidak valid | 422 + pesan transisi mana yang valid |
| Database tidak bisa dihubungi | 503 + halaman error minimal (pakai `APP_DEBUG=false`) |

Pengguna selalu melihat pesan dalam Bahasa Indonesia. Tidak ada pesan error
mentah dari exception yang ditampilkan ke user.

## 10. Pengujian

### Feature tests

Menggunakan **Pest** (sudah ter-*scaffold* di Laravel 12) dengan database
`:memory:`. `php artisan test` harus hijau sebelum dianggap selesai.

| Test | Assert |
|---|---|
| `KatalogTest` | Halaman `/` tampil 200, berisi nama produk yang `tersedia`, tidak berisi yang `tersedia=false`, badge "Habis" muncul |
| `CheckoutTest` | POST valid → order dibuat dengan status benar, `order_items` benar, redirect ke `/pesanan/{kode}` |
| `CheckoutTest` | POST dengan `cara_ambil=antar` dan `kelas` kosong → 422 |
| `CheckoutTest` | POST tanpa `no_wa` → 422 |
| `CheckoutTest` | Keranjang kosong → 422 atau redirect, tidak ada order dibuat |
| `CheckoutTest` | Produk `tersedia=false` di keranjang → 422, tidak ada order |
| `CheckoutTest` | `no_wa` `08xx` dinormalisasi jadi `62xx` |
| `PaymentNotificationTest` | Signature valid + `settlement` → status jadi `lunas` |
| `PaymentNotificationTest` | Signature valid + `pending` → status tetap `menunggu_bayar` |
| `PaymentNotificationTest` | Signature tidak valid → 403, status tidak berubah |
| `PaymentNotificationTest` | Order tidak ada → 200, tidak error |
| `AdminAuthTest` | `/admin` tanpa login → redirect ke `/admin/login` |
| `AdminAuthTest` | Login dengan kredensial benar → redirect ke `/admin` |
| `AdminProdukTest` | Tambah produk → tersimpan, slug unik |
| `AdminProdukTest` | Upload gambar valid → file tersimpan di storage |
| `AdminProdukTest` | Upload file > 2MB → 422 |
| `AdminProdukTest` | Hapus produk yang pernah dipesan → ditolak |
| `CheckoutTest` | Tunai → order langsung `dibuat`, `batas_bayar` null, `snap_token` null |
| `CheckoutTest` | QRIS → order `menunggu_bayar`, `snap_token` terisi, `batas_bayar` terisi |
| `AdminPesananTest` | `lunas` → `dibuat` berhasil |
| `AdminPesananTest` | `dibuat` → `selesai` berhasil |
| `AdminPesananTest` | `menunggu_bayar` → `selesai` ditolak (422, transisi tidak valid) |
| `AdminPesananTest` | `selesai` → `menunggu_bayar` ditolak (422) |

### Manual (tidak di-cover test)

- Tampilan di HP 360px, 390px, 430px
- Tampilan di tablet 768px dan desktop 1280px
- `php artisan storage:link` berfungsi, gambar tampil
- Alur Midtrans produksi (butuh akun real)
- `prefers-reduced-motion` di browser
- Kecepatan muat di koneksi 3G

## 11. Konfigurasi Lingkungan

`.env` lokal:

```
APP_NAME=Foodrink
APP_URL=http://foodrink.test
APP_DEBUG=true
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=foodrink
DB_USERNAME=root
DB_PASSWORD=

MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_PRODUCTION=false
```

`.env` produksi (nanti):

```
APP_DEBUG=false
APP_URL=https://domainmu.com
MIDTRANS_SERVER_KEY=<server key asli>
MIDTRANS_CLIENT_KEY=<client key asli>
MIDTRANS_PRODUCTION=true
```

## 12. Risiko & Batasan yang Diketahui

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Snap popup diblokir browser | Pelanggan tidak bisa bayar | Deteksi `window.closed`, tampilkan tombol "Buka pembayaran lagi" |
| Webhook lolos (server tidak bisa keluar jaringan) | Order menggantung di `menunggu_bayar` | Halaman admin punya tombol "Tandai Lunas" manual untuk QRIS juga |
| Admin salah klik status | Pesanan jadi status yang tidak diinginkan | Tombol status pakai konfirmasi dialog |
| PC Laragon mati saat jam istirahat | Siswa tidak bisa pesan | Jadwal pesan dibuka-tutup admin dari dashboard (toggle) — stretch goal, belum di scope |
| Gambar produk besar | Halaman berat di HP | Kompres ke WebP maks 1200px, maks 2MB sebelum kompres |
| Harga berubah setelah pesanan dibuat | Selisih pembayaran | `order_items` menyimpan salinan harga |
| Admin lupa password | Terkunci | `php artisan tinker` untuk reset password |

## 13. Di Luar Scope

Hal-hal ini sengaja tidak dikerjakan di tahap pertama:

- Riwayat pesanan pengguna / login pelanggan
- Promo, kupon, dan diskon
- Multi-varian per produk (mis. ukuran, level gula) — cukup 1 produk = 1 varian
- Riwayat analytics / grafik penjualan
- Multi-admin dengan hak akses berbeda
- Jadwal buka-tutup pesanan
- Integrasi ongkir otomatis
- Notifikasi WA otomatis ke pelanggan
- PWA / installable
- Multi-bahasa

## 14. Urutan Implementasi

1. Scaffold Laravel + konfigurasi `.env` + `storage:link`
2. Migrasi 3 tabel + seeder admin & produk
3. Model + relationship + enum
4. Layout Blade + token CSS + partials (ikon, grain, product-row)
5. Halaman katalog
6. Keranjang (session) + endpoint tambah/hapus
7. Form checkout + `OrderService`
8. Integrasi Midtrans (service + webhook)
9. Halaman status pesanan + polling
10. Login admin + layout admin
11. CRUD produk
12. Daftar & detail pesanan + aksi status
13. Dashboard ringkasan
14. Polish: animasi, empty state, loading, error handling
15. Jalankan seluruh test, perbaiki sampai hijau

## 15. Kriteria Selesai

- [ ] Katalog tampil benar di 360px sampai 1280px
- [ ] Pelanggan bisa memesan, membayar (simulasi & produksi), dan melihat status
- [ ] Admin bisa login, CRUD produk, dan melihat serta mengubah status pesanan
- [ ] Semua test feature lulus
- [ ] Tidak ada `dd()`, `var_dump`, atau TODO di kode
- [ ] `.env.example` memuat semua variabel Midtrans
- [ ] `README.md` menjelaskan cara setup lokal dan cara deploy
