# Foodrink — Implementation Plan

Tanggal: 2026-09-29
Spec: `docs/superpowers/specs/2026-09-29-foodrink-ordering-design.md`
Target: 15 task, TDD, `php artisan test` hijau di akhir

---

## Cara Pakai Plan Ini

Setiap task punya: **Context** (kenapa), **Files**, **Steps** (langsung nulis kode),
**Verify** (perintah + hasil yang diharapkan), **Commit**.

Aturan: satu task satu commit. Kalau `Verify` gagal, STOP — perbaiki dulu, jangan
lanjut. Jalankan `php artisan test` setiap 3-4 task untuk memastikan tidak ada
regresi.

Set env sekali di Task 1. Semua task berikutnya sudah bisa jalan.

---

## Task 1: Scaffold Project

**Context:** Butuh Laravel 12 yang sudah jalan di Laragon dengan MySQL, plus
Midtrans package, plus test database terpisah.

**Files:**
- Seluruh project (hasil `composer create-project`)
- `.env`
- `config/midtrans.php`
- `phpunit.xml`

**Steps:**

1. Scaffold ke direktori kosong. `C:\laragon\www\foodrink` sekarang berisi
   `.gitignore` + `docs/`, jadi scaffold di subdir lalu pindahkan, atau
   temporarily pindahkan `docs/` keluar:

   ```powershell
   Move-Item C:\laragon\www\foodrink\docs $env:TEMP\foodrink-docs-bak
   Move-Item C:\laragon\www\foodrink\.gitignore $env:TEMP\foodrink-gitignore-bak
   composer create-project laravel/laravel:^12.0 C:\laragon\www\foodrink --no-interaction
   Move-Item "$env:TEMP\foodrink-docs-bak\docs" C:\laragon\www\foodrink\docs
   Move-Item $env:TEMP\foodrink-gitignore-bak C:\laragon\www\foodrink\.gitignore
   ```

2. Install Midtrans:

   ```powershell
   composer require midtrans/midtrans-php
   ```

3. Buat database:

   ```powershell
   & "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS foodrink CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; CREATE DATABASE IF NOT EXISTS foodrink_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

   `utf8mb4` wajib — nama produk bisa mengandung emoji dari admin, dan
   `utf8mb3` akan memotongnya diam-diam.

4. Tulis `.env`:

   ```ini
   APP_NAME=Foodrink
   APP_URL=http://foodrink.test
   APP_DEBUG=true
   APP_TIMEZONE=Asia/Jakarta

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

   `APP_TIMEZONE=Asia/Jakarta` wajib. Tanpa itu, `created_at` order tersimpan
   dalam UTC dan filter "pesanan hari ini" di dashboard akan salah saatawaii
   sudah lewat tengah malam WIB.

5. Tulis `config/midtrans.php` (sudah final di spec §8):

   ```php
   <?php

   $sandbox = ! env('MIDTRANS_PRODUCTION', false);

   return [
       'server_key' => env('MIDTRANS_SERVER_KEY'),
       'client_key' => env('MIDTRANS_CLIENT_KEY'),
       'production' => ! $sandbox,
       'snap_token_url' => $sandbox
           ? 'https://app.sandbox.midtrans.com/snap/v2/transactions'
           : 'https://app.midtrans.com/snap/v2/transactions',
       'api_base_url' => $sandbox
           ? 'https://api.sandbox.midtrans.com/v2'
           : 'https://api.midtrans.com/v2',
       'webhook_hash_key' => env('MIDTRANS_WEBHOOK_HASH_KEY', env('MIDTRANS_SERVER_KEY')),
   ];
   ```

6. `phpunit.xml` — pastikan blok `<php>` memuat:

   ```xml
   <env name="DB_CONNECTION" value="mysql"/>
   <env name="DB_DATABASE" value="foodrink_test"/>
   <env name="APP_ENV" value="testing"/>
   <env name="APP_MAINTENANCE_DRIVER" value="file"/>
   <env name="BCRYPT_ROUNDS" value="4"/>
   <env name="CACHE_STORE" value="array"/>
   <env name="MAIL_MAILER" value="array"/>
   <env name="SESSION_DRIVER" value="array"/>
   <env name="QUEUE_CONNECTION" value="sync"/>
   <env name="MIDTRANS_PRODUCTION" value="false"/>
   <env name="MIDTRANS_SERVER_KEY" value=""/>
   ```

   `BCRYPT_ROUNDS=4` mempercepat test. `foodrink_test` terpisah supaya test
   tidak pernah menghapus data asli.

7. Link storage & migrate default:

   ```powershell
   php artisan storage:link
   php artisan migrate
   ```

8. `.env.example` — tambahkan 3 variabel Midtrans di bagian bawah.

**Verify:**

```powershell
php artisan about
php artisan test
```

Harus: `PHP 8.4.x`, `Laravel Framework 12.x`, `Environment local`,
`DB Connection mysql`, dan 2 test default hijau.

**Commit:** `chore: scaffold Laravel 12 with MySQL and Midtrans config`

---

## Task 2: Enum + Migration + Model

**Context:** Fondasi data. Tabel, model, relationship, dan enum status yang
mengatur seluruh alur pesanan.

**Files:**
- `app/Enums/Kategori.php`
- `app/Enums/StatusOrder.php`
- `database/migrations/2026_01_01_000001_create_products_table.php`
- `database/migrations/2026_01_01_000002_create_orders_table.php`
- `database/migrations/2026_01_01_000003_create_order_items_table.php`
- `app/Models/Product.php`
- `app/Models/Order.php`
- `app/Models/OrderItem.php`

**Steps:**

1. `php artisan make:enum Kategori` dan `make:enum StatusOrder` (Laravel 11+).
   `Kategori`: `PisangNugget = 'pisang_nugget'`, `EsMaboo = 'es_maboo'`, plus
   method `label()` yang mengembalikan `"Pisang Nugget"` / `"Es Maboo"`.

2. `StatusOrder` dengan `allowedTransitions()`. Ini jantung sistem — semua
   perpindahan status diverifikasi lewat sini:

   ```php
   enum StatusOrder: string
   {
       case MenungguBayar = 'menunggu_bayar';
       case Lunas = 'lunas';
       case Dibuat = 'dibuat';
       case Selesai = 'selesai';
       case Batal = 'batal';
       case Kedaluwarsa = 'kedaluwarsa';

       public function allowedTransitions(): array
       {
           return match ($this) {
               self::MenungguBayar => [self::Lunas, self::Kedaluwarsa, self::Batal],
               self::Lunas => [self::Dibuat, self::Batal],
               self::Dibuat => [self::Selesai, self::Batal],
               self::Selesai, self::Batal, self::Kedaluwarsa => [],
           };
       }

       public function isTerminal(): bool
       {
           return $this->allowedTransitions() === [];
       }

       public function label(): string
       {
           return match ($this) {
               self::MenungguBayar => 'Menunggu pembayaran',
               self::Lunas => 'Sudah dibayar',
               self::Dibuat => 'Siap diantar',
               self::Selesai => 'Selesai',
               self::Batal => 'Dibatalkan',
               self::Kedaluwarsa => 'Kedaluwarsa',
           };
       }
   }
   ```

   `Kedaluwarsa` terminal — penting supaya polling halaman status berhenti
   (lihat Task 9). Dan `Dibuat` boleh ke `Batal` supaya admin bisa membatalkan
   order QRIS yang sudah dibayar tapi pelanggan Never datang.

3. `php artisan make:migration create_products_table` — kolom persis spec §3.1.
   `harga` unsignedInteger, `slug` unique, `kategori` string(20),
   `tersedia` boolean default true, `urutan` integer default 0.

4. `php artisan make:migration create_orders_table` — kolom persis spec §3.2.
   `kode` unique string(12). Foreign key: tidak ada (order tidak berelasi ke
   user, `cara_ambil` dan `kelas` plain string).

5. `php artisan make:migration create_order_items_table`:

   ```php
   $table->foreignId('order_id')->constrained()->cascadeOnDelete();
   $table->foreignId('product_id')->constrained()->restrictOnDelete();
   $table->string('nama', 120);
   $table->unsignedInteger('harga');
   $table->unsignedInteger('jumlah');
   $table->unsignedInteger('subtotal');
   ```

6. Model. `Product`: fillable, `casts` (`harga` int, `tersedia` bool,
   `kategori` → `Kategori::class`), scope `tersedia()`, scope
   `urut()`, accessor `harga_rupiah` yang return `"Rp 12.000"`.

   `Order`: `kode` auto-generate di `booted()`, `status` cast ke `StatusOrder`,
   `metode_bayar` + `cara_ambil` cast enum, `total` int. Relationship
   `items()` (hasMany), `bisaDibatalkan()`, `bisaDiSelesaikan()`.

   `OrderItem`: fillable, belongsTo `order` dan `product`, casts int.

7. `KodePesanan` di `app/Support/KodePesanan.php`:

   ```php
   private const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

   public static function generate(): string
   {
       $suffix = '';
       for ($i = 0; $i < 6; $i++) {
           $suffix .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
       }
       return 'FR-'.$suffix;
   }
   ```

   Alphabet tanpa `I`, `O`, `0`, `1` supaya kode tidak ambigu saat dibaca keras
   di kelas. 32^6 = ~1 miliar kombinasi, dan `kode` unique di DB sebagai
   pengaman terakhir kalau ada tabrakan.

**Verify:**

```powershell
php artisan migrate:fresh
php artisan tinker --execute="
\$p = App\Models\Product::create(['nama'=>'Pisang Nugget Original','harga'=>12000,'kategori'=>'pisang_nugget']);
echo \$p->harga_rupiah.' | '.\$p->kategori->label();
"
```

Harus print: `Rp 12.000 | Pisang Nugget`

Lalu cek tabel terisi benar:

```powershell
& "C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe" -u root foodrink -e "DESCRIBE products; DESCRIBE orders; DESCRIBE order_items;"
```

**Commit:** `feat: add enums, migrations, and Eloquent models`

---

## Task 3: Seeder

**Context:** Butuh akun admin + produk contoh supaya app langsung bisa
dibuka setelah install.

**Files:**
- `database/seeders/AdminUserSeeder.php`
- `database/seeders/ProdukSeeder.php`
- `database/seeders/DatabaseSeeder.php`

**Steps:**

1. `AdminUserSeeder` — buat 1 user dari `env('ADMIN_EMAIL', 'admin@foodrink.test')`
   dan `env('ADMIN_PASSWORD', 'rahasia123')`. Pakai `updateOrCreate` supaya
   aman dijalankan berulang. Password di-hash (default cast `hashed` di
   Laravel 11+ sudah otomatis).

2. `ProdukSeeder` — 6 produk contoh: 4 pisang nugget (Original, Coklat Keju,
   Keju Susu, Original Extra Porsi) + 2 es maboo (Original, Mangga). Harga
   8000–15000. Pakai `updateOrCreate` pada `nama` supaya tidak duplikat.

3. `DatabaseSeeder` memanggil keduanya.

4. Jalankan sekali, cek, lalu `migrate:fresh --seed` untuk reset bersih.

**Verify:**

```powershell
php artisan migrate:fresh --seed
php artisan tinker --execute="echo App\Models\User::count().' user, '.App\Models\Product::count().' produk';"
```

Harus print: `1 user, 6 produk`

**Commit:** `feat: seed admin user and sample products`

---

## Task 4: Design Token + Layout Shop

**Context:** Semua halaman publik butuh satu sumber gaya. Token dulu supaya
halaman-halaman berikutnya cuma pakai `var(--...)`, tidak ada hex color
scatter.

**Files:**
- `resources/css/app.css` ( ganti seluruh isi )
- `resources/views/layouts/shop.blade.php`
- `resources/views/partials/icon.blade.php`
- `resources/views/partials/flash.blade.php`

**Steps:**

1. `resources/css/app.css` — token persis spec §7.1. CSS variables untuk 8
   warna, skala tipografi `clamp()`, spacing 4px, 3 radius, 1 shadow.
   Import Fraunces + Plus Jakarta Sans dari Google Fonts dengan `preconnect`
   dan `font-display: swap`. Body pakai tekstur kertas (radial-gradient halus +
   SVG noise data URI, spec §7.3). Reset ringan, `box-sizing: border-box`,
   `-webkit-tap-highlight-color: transparent` supaya tidak ada flash biru saat
   tap di HP.

2. `layouts/shop.blade.php` — `<meta viewport>` dengan
   `viewport-fit=cover`, `<meta name="theme-color" content="#F5EFE3">`,
   `@vite(['resources/css/app.css', 'resources/js/app.js'])`, header sticky
   56px berisi wordmark "Foodrink" (Fraunces) + tombol keranjang dengan badge
   jumlah. Slot `@stack('head')` untuk script per halaman. `@yield('konten')`
   dengan padding-bottom untuk ruang sticky bottom bar.

3. `partials/icon.blade.php` — komponen Blade yang merender SVG inline dari
   array. 11 ikon: keranjang, plus, minus, cek, silang, chevron, lokasi,
   dompet, trash, edit, search. Semua `stroke-width="1.75"`,
   `currentColor`, `fill="none"`, `aria-hidden="true"`. Pemakaian:
   `<x-icon name="keranjang" size="20" />`.

   ⚠️ Ini satu-satunya tempat SVG berada. Kalau butuh ikon baru, tambahkan di
   sini — jangan tulis `<svg>` inline di view.

4. `partials/flash.blade.php` — banner untuk session flash, 3 varian
   (success/warning/error), auto-hide 4 detik via JS, `role="alert"` biar
   terbaca screen reader.

**Verify:**

```powershell
npm install
npm run build
php artisan serve
```

Buka `http://127.0.0.1:8000` — harus muncul header "Foodrink" di atas
background krem dengan tekstur kertas, font Fraunces untuk wordmark. Tidak ada
error di terminal.

DevTools → Network → pabilidade "Offline" untuk cek tekstur tetap tampil.
DevTools → Rendering → Emulate `prefers-reduced-motion` untuk cek animasi
mati.

**Commit:** `feat: add design tokens, shop layout, and icon component`

---

## Task 5: Halaman Katalog

**Context:** Halaman pertama yang dilihat siswa. Harus cepat dimuat di HP dan
gampang di-scan.

**Files:**
- `app/Http/Controllers/KatalogController.php`
- `resources/views/shop/katalog.blade.php`
- `resources/views/partials/product-row.blade.php`
- `resources/js/app.js`
- `routes/web.php`
- `tests/Feature/KatalogTest.php`

**Steps (TDD — test dulu):**

1. `php artisan make:test KatalogTest`. Tulis test:

   ```php
   test('katalog menampilkan produk yang tersedia', function () {
       $tersedia = Product::factory()->create(['nama' => 'Pisang Nugget Original', 'tersedia' => true]);
       $habis = Product::factory()->create(['nama' => 'Es Maboo Habis', 'tersedia' => false]);

       $this->get('/')
           ->assertOk()
           ->assertSee($tersedia->nama)
           ->assertDontSee($habis->nama);
   });

   test('produk yang tidak tersedia menampilkan badge Habis', function () {
       Product::factory()->create(['nama' => 'Es Maboo Mango', 'tersedia' => false]);

       $this->get('/')->assertOk()->assertSee('Habis');
   });

   test('produk dikelompokkan per kategori', function () {
       Product::factory()->create(['nama' => 'Pisang Nugget Original', 'kategori' => 'pisang_nugget']);
       Product::factory()->create(['nama' => 'Es Maboo Original', 'kategori' => 'es_maboo']);

       $this->get('/')
           ->assertOk()
           ->assertSeeInOrder(['Pisang Nugget', 'Es Maboo']);
   });
   ```

2. Jalankan → harus GAGAL (route belum ada). Ini benar, itu artinya test-nya
   bekerja.

3. `KatalogController` — `index()` ambil semua produk, group by `kategori`
   (pakai `Kategori::cases()` supaya urutan kategori stabil, bukan urutan
   acak dari `groupBy`):

   ```php
   public function index()
   {
       $semua = Product::tersedia()->urut()->get();
       $produkPerKategori = collect(Kategori::cases())
           ->mapWithKeys(fn (Kategori $k) => [$k->value => $semua->where('kategori', $k)->values()])
           ->filter(fn ($items) => $items->isNotEmpty());

       return view('shop.katalog', compact('produkPerKategori'));
   }
   ```

   ⚠️ `semua->where('kategori', $k)` bekerja karena `kategori` sudah di-cast
   ke enum, jadi nilainya `Kategori`, bukan string.

4. `routes/web.php`: `Route::get('/', [KatalogController::class, 'index'])->name('katalog');`

5. `shop/katalog.blade.php` — judul besar "Pisang Nugget" / "Es Maboo" per
   kategori (Fraunces, clamp 2rem–3.5rem), lalu loop `product-row`.

6. `partials/product-row.blade.php` — grid `96px 1fr auto`, foto 96×96 radius
   4px dengan border 3px `--bata`, nama produk Fraunces 1.25rem, harga
   `--bata` dengan tabular-nums, tombol `+` 40px bulat. Produk habis: foto
   grayscale + `opacity: .5`, badge "Habis", tombol disabled. whole row
   diklik untuk masuk halaman detail (stretch di Task 12).

7. `resources/js/app.js` — stagger entry katalog: produk dapat
   `animation-delay` inline `style="--i: {{ $i }}"` dan CSS
   `@keyframes naik { from { opacity:0; transform: translateY(8px) } }`.
   Cap di 6 item. `prefers-reduced-motion: reduce` → `animation: none`.

   ⚠️ Pakai `@keyframes`, bukan IntersectionObserver. Katalog render
   server-side dan produk langsung terlihat — IntersectionObserver di sini
   cuma menambah JS tanpa Delay yangCCR perlu.

8. Jalankan test → harus hijau.

**Verify:**

```powershell
php artisan test --filter=KatalogTest
```

Harus: 3 passed. Lalu buka `/` di browser dan resize ke 360px.

**Commit:** `feat: add product catalog page`

---

## Task 6: Factory Produk

**Context:** Task 7+ butuh banyak produk palsu. Factory mempercepat itu.

**Files:**
- `database/factories/ProductFactory.php`
- `database/factories/OrderFactory.php`
- `database/factories/OrderItemFactory.php`
- `app/Models/User.php` (tambah `HasFactory`)

**Steps:**

1. `php artisan make:factory ProductFactory -m`

2. Definition dengan `faker` Indonesia-appropriate:

   ```php
   public function definition(): array
   {
       return [
           'nama' => fake()->randomElement([
               'Pisang Nugget Original', 'Pisang Nugget Coklat',
               'Pisang Nugget Keju Susu', 'Pisang Nugget Madu',
               'Es Maboo Original', 'Es Maboo Mangga', 'Es Maboo Jambu',
           ]),
           'deskripsi' => fake()->sentence(8),
           'harga' => fake()->randomElement([8000, 10000, 12000, 15000]),
           'kategori' => fake()->randomElement(Kategori::cases()),
           'gambar' => null,
           'tersedia' => true,
           'urutan' => fake()->numberBetween(0, 10),
       ];
   }
   ```

   Tambahkan state `habis()` → `['tersedia' => false]`.

3. `OrderFactory` + `OrderItemFactory` (dipakai Task 8, 12).

**Verify:**

```powershell
php artisan tinker --execute="echo App\Models\Product::factory()->count(3)->create()->pluck('nama')->join(', ');"
```

Harus print 3 nama produk, tanpa error.

**Commit:** `feat: add model factories`

---

## Task 7: Keranjang

**Context:** Cara siswa memilih produk. Harus jalan tanpa JavaScript supaya
tidak fragile di HP sekolah yang lambat.

**Files:**
- `app/Services/CartService.php`
- `app/Http/Controllers/KeranjangController.php`
- `resources/views/shop/keranjang.blade.php`
- `resources/views/partials/cart-bar.blade.php`
- `routes/web.php`
- `tests/Feature/KeranjangTest.php`

**Steps (TDD):**

1. `make:test KeranjangTest` — test: tambah produk masuk session, ubah jumlah,
   hapus item, keranjang kosong saat buka halaman → redirect ke `/` dengan
   flash. Plus: produk `tersedia = false` tidak bisa ditambah (422).

2. `CartService` — semua operasi session di sini, tidak langsung di controller:

   ```php
   const KUNCI = 'keranjang';

   public function items(): Collection   // [['produk' => Product, 'jumlah' => int], ...]
   public function tambah(Product $produk, int $jumlah = 1): void
   public function ubahJumlah(int $produkId, int $jumlah): void
   public function hapus(int $produkId): void
   public function kosongkan(): void
   public function total(): int
   public function jumlahItem(): int
   public function kosong(): bool
   ```

   ⚠️ Simpan **id produk** di session, bukan objek `Product`. Kalau simpan
   objek, session jadi `Serializable` dan produk yang di-edit admin tidak
   ter-refresh di keranjang pelanggan.

3. `KeranjangController` — `tambah`, `update`, `hapus`, `show`. Semua
   non-GET redirect balik ke `/keranjang` dengan flash. `show` kalau kosong →
   redirect `/`.

   `tambah` tolak produk `tersedia = false` dengan 422 + flash.

4. `shop/keranjang.blade.php` — list item: foto 64×64, nama, harga satuan,
   kontrol jumlah `− [n] +` (dua form, bukan JS), tombol hapus per item.
   Sticky bottom: total (`Fraunces`, tabular-nums) + tombol **Lanjut** full
   width, min 48px.

5. `partials/cart-bar.blade.php` — komponen yang dipakai katalog + keranjang:
   sticky bottom, jumlah item, total, tombol Lanjut. Hanya render kalau
   `$jumlah > 0` supaya tidak muncul saat keranjang kosong.

6. Route (semua dalam `Route::post`/`Route::patch`/`Route::delete`):

   ```php
   Route::post('/keranjang/tambah', [KeranjangController::class, 'tambah'])->name('keranjang.tambah');
   Route::patch('/keranjang/{produk}', [KeranjangController::class, 'update'])->name('keranjang.update');
   Route::delete('/keranjang/{produk}', [KeranjangController::class, 'hapus'])->name('keranjang.hapus');
   Route::get('/keranjang', [KeranjangController::class, 'show'])->name('keranjang.show');
   ```

7. Badge keranjang di header: render jumlah dari session, jadi konsisten
   tanpa JS. animasi `scale` saat berubah — pakai CSS transition sederhana
   dengan `:has()` atau class dari server, jangan JS polling.

**Verify:**

```powershell
php artisan test --filter=KeranjangTest
```

Harus hijau. Manual: buka `/`, klik `+` 2x, badge header jadi 2, bottom bar
muncul, `−` jadi 1, hapus jadi 0 dan bottom bar hilang.

**Commit:** `feat: add session cart`

---

## Task 8: Checkout + OrderService

**Context:**Otak bisnis. Validasi, hitung total, cek ketersediaan, buat
order. Harus benar walau dua orang checkout bersamaan.

**Files:**
- `app/Services/OrderService.php`
- `app/Http/Requests/StoreCheckoutRequest.php`
- `app/Http/Controllers/CheckoutController.php`
- `resources/views/shop/checkout.blade.php`
- `routes/web.php`
- `tests/Feature/CheckoutTest.php`

**Steps (TDD):**

1. `make:test CheckoutTest`. Test yang wajib ada (dari spec §10):

   - checkout valid QRIS → order `menunggu_bayar`, item benar, redirect
   - checkout valid tunai → order `dibuat` langsung, `batas_bayar` null
   - `cara_ambil=antar` + `kelas` kosong → 422
   - tanpa `no_wa` → 422
   - keranjang kosong → tidak ada order dibuat
   - produk `tersedia=false` di keranjang → 422, tidak ada order
   - `no_wa` `081234567890` → tersimpan `6281234567890`
   - harga berubah setelah masuk keranjang → order pakai harga SAAT ORDER

2. `StoreCheckoutRequest` — rules:

   ```php
   'nama' => ['required', 'string', 'min:2', 'max:120'],
   'kelas' => ['nullable', 'string', 'max:30', Rule::requiredIf($this->cara_ambil === 'antar')],
   'no_wa' => ['required', 'string', 'max:25'],
   'cara_ambil' => ['required', Rule::in(['antar', 'ambil'])],
   'metode_bayar' => ['required', Rule::in(['qris', 'tunai'])],
   ```

   Custom message Bahasa Indonesia untuk setiap rule.

3. `OrderService`:

   ```php
   public function create(array $data, array $keranjang): Order
   ```

   Isi:
   - Query ulang semua produk dari DB pakai `whereIn('id', ...)` → bisa
    ikoerce harga terbaru dan cek `tersedia` dalam satu query
   - Kalau ada yang `tersedia = false` → throw `ProductTidakTersediaException`
     berisi nama produk yang bermasalah
   - Bentuk `order_items` dari hasil query (bukan dari session), salin
     `nama` + `harga`
   - `total` = jumlah subtotal
   - Wrap dalam `DB::transaction()`
   - Status: `tunai` → `Dibuat`, `qris` → `MenungguBayar` + `batas_bayar`
     = `now()->addMinutes(15)`

   ⚠️ Query ulang produk dari DB (bukan pakai data session) itu wajib. Kalau
   pakai session, harga yang disimpan bisa harga lama — dan uang yang masuk
   tidak akan cocok.

4. Exception custom `app/Exceptions/ProductTidakTersediaException.php` dengan
   property `$namaProduk`. Controller catch → flash error + redirect ke
   `/keranjang`.

5. `CheckoutController` — `create()` tampilkan form (prefill session supaya
   tidak ketik ulang), `store()` validasi → `OrderService` → redirect
   `/pesanan/{kode}`.

6. Route dengan throttle:

   ```php
   Route::get('/pesan', [CheckoutController::class, 'create'])->name('checkout');
   Route::post('/pesan', [CheckoutController::class, 'store'])
       ->middleware('throttle:6,1')
       ->name('checkout.store');
   ```

7. `shop/checkout.blade.php` — form: nama, kelas, no WA (`inputmode="tel"`
   + `autocomplete="tel"`, supaya keyboard numerik muncul di HP), dua pilihan
   cara ambil sebagai radio-card besar (bukan `<select>` — lebih gampang
   ditek), dua pilihan metode bayar. Ringkasan order sticky di atas tombol
   submit.

   ⚠️ Radio cara ambil & metode bayar pakai `<label>` + input tersembunyi,
   CSS `:checked + span` untuk state aktif.native radio kecil susah
   diklik di HP.

**Verify:**

```powershell
php artisan test --filter=CheckoutTest
```

Harus hijau semua. Manual: isi form, pilih QRIS, submit — harus sampai
`/pesanan/{kode}`.

**Commit:** `feat: add checkout flow and order service`

---

## Task 9: Integrasi Midtrans

**Context:** QRIS dinamis. Bagian paling rawan karena melibatkan jaringan
eksternal — jadi testing harus pakai fake, bukan panggilan sungguhan.

**Files:**
- `app/Services/MidtransService.php`
- `app/Http/Controllers/PaymentNotificationController.php`
- `tests/Fakes/FakeMidtransClient.php`
- `config/midtrans.php` (baca `client_key` untuk frontend)
- `tests/Feature/PaymentTest.php`

**Steps (TDD):**

1. **Pakai interface, jangan static `\Midtrans\Snap`.** `\Midtrans\Snap` adalah
   static global yang memakai config global — buat pengujian hampir mustahil.
   Bungkus di interface:

   ```php
   interface MidtransClient
   {
       public function createToken(array $payload): string;
       public function status(string $orderId): array;
       public function isValidSignature(array $payload): bool;
   }
   ```

   Bind di service provider: `FakeMidtransClient` kalau
   `app()->environment('testing')`, `RealMidtransClient` kalau tidak. Test
   pakai fake, tidak pernah menyentuh jaringan.

2. Test webhook dulu:

   ```php
   test('settlement membuat order lunas', function () {
       $order = Order::factory()->create(['status' => StatusOrder::MenungguBayar]);
       // fake signature valid
       $this->postJson('/api/pembayaran/cek', [...])->assertOk();
       expect($order->fresh()->status)->toBe(StatusOrder::Lunas);
   });

   test('signature tidak valid ditolak 403 dan status tidak berubah', ...);
   test('order tidak ditemukan membalas 200', ...);
   test('expire setelah batas bayar menjadi kedaluwarsa', ...);
   ```

3. `RealMidtransClient` — `composer require midtrans/midtrans-php` sudah
   Task 1. Set `\Midtrans\Config::$serverKey` dari config, lalu
   `Snap::getSnapToken($payload)`. Signature: `\Midtrans\Notification` sudah
   verifikasi hash-nya sendiri, tapi kalau tidak pakai class itu, hitung
   manual `sha512(order_id + status_code + gross_amount + serverKey)`.

4. `MidtransService` — logic milik kita, panggilan HTTP didelegasikan ke
   `MidtransClient`:

   ```php
   public function buatTransaksi(Order $order): void
   {
       $payload = [
           'transaction_details' => [
               'order_id' => $order->kode,
               'gross_amount' => $order->total,
           ],
           'customer_details' => [
               'first_name' => $order->nama,
               'phone' => $order->no_wa,
           ],
           'item_details' => $order->items->map(fn ($i) => [
               'id' => $i->product_id,
               'price' => $i->harga,
               'quantity' => $i->jumlah,
               'name' => $i->nama,
           ])->all(),
           'enabled_payments' => ['qris'],
       ];

       $order->update([
           'snap_token' => $this->client->createToken($payload),
           'midtrans_order_id' => $order->kode,
       ]);
   }
   ```

   `enabled_payments` cuma `qris` — sesuai keputusan spec. Kalau nanti mau
   nambah e-wallet, tinggal tambah di sini.

   `midtrans_order_id` = `kode` order. Ini disengaja: Midtrans mewajibkan
   `order_id` unik dan maksimal sekali dipakai, dan `kode` kita sudah unik.

5. `CheckoutController::store()` — setelah order QRIS dibuat, panggil
   `MidtransService::buatTransaksi()`, lalu redirect dengan flash info
   "Selesaikan pembayaran".

   ⚠️ Kalau `createToken` gagal (jaringan/Midtrans down), order **tetap ada**
   dengan status `menunggu_bayar`, dan flash error: "Gagal membuka pembayaran,
   coba lagi." Jangan hapus order — webhook tetap mungkin datang belakangan.

6. `PaymentNotificationController` —handler `/api/pembayaran/cek`. Urutan:
   verifikasi signature (403 kalau gagal) → cari order → update status →
   balas 200 JSON.

   ⚠️ Balas 200 **meski order tidak ditemukan**. Midtrans retry kalau
   dapat non-200, dan retry order yang sudah tidak ada itu sia-sia tapi
   membebani server.

   ⚠️ Route ini **harus** di luar middleware `web` CSRF atau di-exempt,
   karena Midtrans tidak mengirim token CSRF. Pakai `->withoutMiddleware([
   ValidateCsrfToken::class])` atau taruh di `routes/api.php`. Tambah juga
   `throttle` supaya tidak bisa dipakai spam.

7. Snap JS di halaman status. Script dari `app.sandbox.midtrans.com` atau
   `app.midtrans.com` sesuai `config('midtrans.production')`, `data-client-key`
   dari `config('midtrans.client_key')`. Panggil `snap.pay(token, {
   onSuccess/onPending/onClose })`.

**Verify:**

```powershell
php artisan test --filter=PaymentTest
```

Harus hijau tanpa akses jaringan (fake). Manual: `php artisan serve`, checkout
QRIS tanpa `MIDTRANS_SERVER_KEY` → dapat token dummy, popup tidak muncul,
tapi halaman status tetap terbuka. Isi sandbox key asli untuk uji penuh.

**Commit:** `feat: integrate Midtrans Snap with testable client interface`

---

## Task 10: Halaman Status Pesanan

**Context:** Setelah bayar, siswa perlu tahu apa yang terjadi. Ini satu-satunya
layar yang dilihat sambil antre.

**Files:**
- `app/Http/Controllers/PesananController.php`
- `resources/views/shop/pesanan.blade.php`
- `routes/web.php`
- `tests/Feature/PesananTest.php`

**Steps (TDD):**

1. `make:test PesananTest` — test: kode valid → 200, kode ngawur → 404,
   endpoint status return JSON dengan `status` + `label` + `terminal`, header
   `Cache-Control: no-store`.

2. Route:

   ```php
   Route::get('/pesanan/{kode}', [PesananController::class, 'show'])->name('pesanan.show');
   Route::get('/pesanan/{kode}/status', [PesananController::class, 'status'])
       ->name('pesanan.status')
       ->middleware('throttle:120,1');
   ```

   ⚠️ `status` dipisah dari `show` supaya bisa dipanggil tanpa render ulang
   seluruh halaman. `throttle:120,1` = 120 request/menit per IP, cukup untuk
   polling 5 detik dari beberapa tab.

3. `show()` — cari order by `kode`, `abort_if(! $order, 404)`. Tampilkan:
   nomor pesanan besar (Fraunces), status badge, ringkasan item, total,
   instruksi per status:
   - `menunggu_bayar` → "Menunggu pembayaranmu. Jangan tutup halaman ini."
     + tombol Buka Pembayaran (kalau `snap_token` ada)
   - `dibuat` (tunai) → "Bayar di kasir, ya. Tunjukkan halaman ini ke kasir."
   - `dibuat` (QRIS) → "Sudah kami terima. Sedang disiapkan."
   - `selesai` → "Selesai. Sampai jumpa!"
   - `kedaluwarsa` → "Pembayaran lewat. Pesanan ini dibatalkan."
   - `batal` → "Pesanan ini dibatalkan."

4. Polling JS — `setInterval` 5000ms, `fetch` endpoint status, ganti badge
   kalau berubah. Berhenti kalau `terminal: true` atau sudah 10 menit
   (120 kali). Jangan poll halaman, cukup pakai JSON endpoint.

5. `status()` — return JSON:

   ```php
   return response()->json([
       'status' => $order->status->value,
       'label' => $order->status->label(),
       'terminal' => $order->status->isTerminal(),
   ])->header('Cache-Control', 'no-store, max-age=0');
   ```

**Verify:**

```powershell
php artisan test --filter=PesananTest
```

Harus hijau. Manual: buka `/pesanan/FR-XXXXXX` dari hasil checkout, ubah
status di database -> polling ter-update dalam 5 detik tanpa refresh.

**Commit:** `feat: add order status page with polling`

---

## Task 11: Login Admin + Layout Admin

**Context:** Admin butuh tempat kerja. Layout admin sengaja beda dari shop —
lebih dense, fungsional, bukan cantik-cantik.

**Files:**
- `app/Http/Controllers/Admin/AuthController.php`
- `app/Http/Middleware/EnsureAdmin.php`
- `resources/views/layouts/admin.blade.php`
- `resources/views/admin/login.blade.php`
- `routes/web.php`
- `tests/Feature/AdminAuthTest.php`

**Steps (TDD):**

1. `make:test AdminAuthTest` — test: `/admin` tanpa login → redirect
   `/admin/login`; login benar → redirect `/admin`; login salah → error,
   tidak redirect; logout → tidak bisa akses `/admin` lagi.

2. `AuthController` — `showLogin()`, `login()` (pakai `Auth::attempt` +
   regenerate session), `logout()` (invalidate + regenerate token).
   `throttle:5,1` di `login()` biar tidak bisa brute force.

3. Group route dengan prefix + middleware:

   ```php
   Route::prefix('admin')->name('admin.')->group(function () {
       Route::middleware('guest')->group(function () {
           Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
           Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
       });
       Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth')->name('logout');
       Route::middleware('auth')->group(function () {
           // ... semua route admin lain
       });
   });
   ```

   ⚠️ `EnsureAdmin` yang saya rancang di spec ternyata tidak perlu —
   `users` table sudah dijaga Laravel dan hanya ada 1 akun, jadi middleware
   `auth` bawaan cukup. Spec §8 menyebut `EnsureAdmin.php`; **hapus dari
   spec** karena tidak ada yang memakainya.

4. `layouts/admin.blade.php` — sidebar di desktop, topbar + nav scroll
   horizontal di mobile. Tabel dense (`--text-sm`, row padding 10px 12px).
   Header berisi tombol **+ Produk** dan logout._flash messages di bawah
   header.

   Tabel → kartu bertumpuk di mobile: `@media (max-width: 640px)` ubah
   `table` jadi block, `td::before { content: attr(data-label) }`.

5. `admin/login.blade.php` — form email + password di tengah layar, width
   max 360px, di atas tekstur kertas yang sama.

**Verify:**

```powershell
php artisan test --filter=AdminAuthTest
```

Harus hijau. Manual: `php artisan tinker --execute="\App\Models\User::first()->update(['password' => 'rahasia123']);"` lalu
buka `/admin`.

**Commit:** `feat: add admin authentication and layout`

---

## Task 12: CRUD Produk

**Context:** Spec utama: "produk diatur di halaman admin".

**Files:**
- `app/Http/Controllers/Admin/ProdukController.php`
- `app/Http/Requests/StoreProductRequest.php`
- `app/Services/ImageService.php`
- `resources/views/admin/produk/{index,create,edit}.blade.php`
- `routes/web.php`
- `tests/Feature/AdminProdukTest.php`

**Steps (TDD):**

1. `make:test AdminProdukTest` - test: tambah produk -> tersimpan + slug unik;
   nama duplikat -> slug unik lanjutan (append `-2`); upload valid -> file
   tersimpan; upload > 2MB → 422; upload non-gambar → 422; edit → tersimpan;
   hapus produk tanpa order → terhapus; **hapus produk yang sudah pernah
   dipesan → ditolak**; toggle tersedia → berubah; halaman `/admin/produk`
   butuh login.

2. `StoreProductRequest` — `nama` required max 120, `harga` required integer
   min 1 max 9999999, `kategori` required `Rule::enum(Kategori::class)`,
   `deskripsi` nullable max 500, `gambar` nullable image mimes jpg,jpeg,png,webp
   max 2048, `tersedia` boolean, `urutan` integer min 0.

3. `ImageService` — `simpan(UploadedFile $file): string`:
   validasi MIME sudah dari Request, di sini justru proses: resize max
   1200px (GD atau Imagick, pilih mana yang tersedia di Laragon), save
   WebP quality 82 ke `storage/app/public/products/` dengan nama
   `Str::random(20).'.webp'`, return path relatif. `hapus(?string $path)` buat
   file lama saat produk di-edit.

   ⚠️ Cek `extension_loaded('gd')` atau `extension_loaded('imagick')` — kalau
   dua-duanya tidak ada, jangan `die()`, lempar exception dengan pesan jelas
   supaya ketahuan dari awal, bukan gagal mysterious di tengah jalan.

4. `ProdukController` — `index` (daftar + filter kategori), `create`, `store`,
   `edit`, `update`, `destroy`, `toggle`.

   `destroy()`:
   ```php
   if ($produk->orderItems()->exists()) {
       return back()->with('error', 'Produk ini sudah pernah dipesan, nonaktifkan saja.');
   }
   $this->images->hapus($produk->gambar);
   $produk->delete();
   return back()->with('success', 'Produk dihapus.');
   ```

   `toggle()` — PATCH via fetch, return JSON `['tersedia' => bool]`. View
   pakai `fetch` tanpa reload, ganti isi toggle + badge.

5. `admin/produk/index.blade.php` — tabel: thumbnail 48×48, nama, kategori
   (badge `--kunyit`), harga, toggle tersedia, urutan, aksi edit/hapus.
   Hapus pakai `onclick="return confirm('...')"` — cukup, tidak perlu modal.

6. `admin/produk/create.blade.php` + `edit.blade.php` — satu partial
   `_form.blade.php` dipakai dua-duanya (DRY). Field: nama, harga, kategori
   (radio 2 opsi, bukan select), deskripsi (textarea), upload gambar
   (preview klien via FileReader, tampilkan gambar lama kalau edit), tersedia
   (checkbox), urutan (number).

   ⚠️ Wajib `<input type="file" name="gambar" accept="image/jpeg,image/png,image/webp">`
   dan `@error('gambar')` di bawahnya. Ini yang paling sering bikin form
   gagal diam-diam di semua proyek.

**Verify:**

```powershell
php artisan test --filter=AdminProdukTest
```

Harus hijau. Manual: `http://foodrink.test/admin/produk` — tambah produk
dengan gambar, cek thumbnail muncul, toggle availability, coba hapus produk
yang sudah ada di `order_items` → harus ditolak.

**Commit:** `feat: add admin product CRUD with image upload`

---

## Task 13: Manajemen Pesanan Admin

**Context:** Ini layar yang dipakai owner setiap jam istirahat. Prioritas:
bisa dipindai dengan mata, bukan membaca.

**Files:**
- `app/Http/Controllers/Admin/PesananController.php`
- `resources/views/admin/pesanan/{index,show}.blade.php`
- `routes/web.php`
- `tests/Feature/AdminPesananTest.php`

**Steps (TDD):**

1. `make:test AdminPesananTest` — test (dari spec §10): `lunas` → `dibuat`
   berhasil; `dibuat` → `selesai` berhasil; `menunggu_bayar` → `selesai`
   **ditolak 422**; `selesai` → `menunggu_bayar` ditolak; list terfilter
   `?status=`; semua route butuh login.

2. Route:

   ```php
   Route::get('/pesanan', [PesananController::class, 'index'])->name('pesanan.index');
   Route::get('/pesanan/{order}', [PesananController::class, 'show'])->name('pesanan.show');
   Route::patch('/pesanan/{order}/status', [PesananController::class, 'updateStatus'])
       ->name('pesanan.status');
   ```

3. `index()` — filter dari query `?status=`, default `dibuat,lunas`:

   ```php
   $statuses = $request->string('status')->isEmpty()
       ? [StatusOrder::Dibuat, StatusOrder::Lunas]
       : collect(explode(',', $request->string('status')->toString()))
           ->map(fn ($s) => StatusOrder::tryFrom(trim($s)))
           ->filter()
           ->all();

   $orders = Order::whereIn('status', array_map(fn ($s) => $s->value, $statuses))
       ->with('items')
       ->orderByRaw("FIELD(status, 'dibuat', 'lunas')")  // MySQL-only
       ->latest()
       ->paginate(20);
   ```

   CATATAN: `FIELD()` khusus MySQL. Kalau nanti pindah ke PostgreSQL, ganti dengan
   `CASE WHEN status = 'dibuat' THEN 0 ELSE 1 END`. Tulis sebagai catatan kecil.

4. `updateStatus()` — validasi transisi:

   ```php
   $target = StatusOrder::tryFrom($request->string('status')->toString());

   if (! $target || ! in_array($target, $order->status->allowedTransitions(), true)) {
       return back()->with('error', "Status tidak bisa diubah ke itu. Pilihan: ".
           collect($order->status->allowedTransitions())->map->label()->join(' atau '));
   }

   $order->update(['status' => $target]);
   return back()->with('success', "Status diubah ke {$target->label()}.");
   ```

   `in_array` dengan `strict: true` wajib — kalau tidak, `StatusOrder` dan
   string bisa lolos perbandingan longgar.

5. `admin/pesanan/index.blade.php` — tab filter (Perlu Diproses / Menunggu
   Bayar / Selesai / Kedaluwarsa / Batal / Semua, aktif = underline `--bata`
   + `aria-current="page"`). Tabel: kode (mono, kecil), nama, **kelas badge
   besar** (`--kunyit` background, bold), metode bayar (ikon dompet + teks),
   jumlah item, total, status badge, waktu.

   ⚠️ Badge kelas harus mencolok. Itu informasi paling sering dicari owner
   saat mau antar.

6. `admin/pesanan/show.blade.php` — data pemesan, item (nama, harga, jumlah,
   subtotal), total, cara ambil, metode, status. Tombol status sesuai
   tabel spec §6.4. Semua tombol status pakai `onsubmit="return confirm(...)"`
   supaya tidak salah klik.

   Untuk QRIS yang masih `menunggu_bayar`: tombol **Buka Pembayaran Lagi**
   yang load Snap JS dan `snap.pay('{{ $order->snap_token }}')`.

**Verify:**

```powershell
php artisan test --filter=AdminPesananTest
```

Harus hijau. Manual: buat order tunai, buka `/admin/pesanan`, klik Selesai,
refresh — status berubah.

**Commit:** `feat: add admin order management`

---

## Task 14: Dashboard Admin

**Context:** Layar pertama setelah login. Cukup untuk tahu "hari ini berapa".

**Files:**
- `app/Http/Controllers/Admin/DashboardController.php`
- `resources/views/admin/dashboard.blade.php`
- `routes/web.php`

**Steps:**

1. `DashboardController`:

   ```php
   public function index()
   {
       $hariIni = now()->startOfDay();

       $jumlahHariIni = Order::where('created_at', '>=', $hariIni)->count();

       $omzetHariIni = Order::where('created_at', '>=', $hariIni)
           ->whereIn('status', [
               StatusOrder::Lunas->value,
               StatusOrder::Dibuat->value,
               StatusOrder::Selesai->value,
           ])
           ->sum('total');

       $perStatus = Order::selectRaw('status, COUNT(*) as jumlah')
           ->groupBy('status')
           ->pluck('jumlah', 'status');

       $terbaru = Order::with('items')->latest()->limit(10)->get();

       return view('admin.dashboard', compact('jumlahHariIni', 'omzetHariIni', 'perStatus', 'terbaru'));
   }
   ```

   ⚠️ Query `omzet` **tidak boleh** menyertakan `menunggu_bayar` — uang yang
   belum masuk bukan omzet. Ini kesalahan yang gampang terjadi.

   ⚠️ `where('created_at', '>=', now()->startOfDay())` bergantung pada
   `APP_TIMEZONE` yang benar (Task 1). Kalau salah, angka "hari ini" meleset
   setelah jam 7 malam WIB.

2. `admin/dashboard.blade.php` — tiga angka besar (Fraunces, tabular-nums):
   Pesanan hari ini, Omzet hari ini, Perlu diproses (`dibuat` + `lunas`).
   Di bawahnya: daftar 10 pesanan terbaru dengan kode, nama, kelas, status.

**Verify:**

```powershell
php artisan test
php artisan serve
```

Buka `/admin` — tiga angka tampil.Buat beberapa order, angka berubah.

**Commit:** `feat: add admin dashboard`

---

## Task 15: Polish + Verifikasi Akhir

**Context:** Bagian yang bikin enak dipakai. Kalau dilewat, produk tetap jalan
tapi terasa "template".

**Files:**
- `resources/js/app.js`
- `resources/views/shop/katalog.blade.php`
- `resources/views/admin/*`
- `README.md`
- `public/.htaccess` (Laragon sudah ada, cek saja)

**Steps:**

1. **Animasi** — sudah ada di Task 5. Tambahkan badge keranjang scale saat
   berubah. Semua di balik `prefers-reduced-motion`.

2. **Empty states** — 4 tempat:
   - Katalog kosong: ikon keranjang + "Belum ada jualan hari ini. Cek lagi nanti!"
   - Keranjang kosong: "Keranjangmu masih kosong" + tombol ke katalog
   - Filter pesanan kosong: "Tidak ada pesanan di status ini"
   - Dashboard tanpa pesanan: "Belum ada pesanan hari ini"

   Setiap empty state punya `text-align: center`, `padding: 48px 24px`, dan
   **tetap ada tombol aksi**. Jangan cuma teks.

3. **Error page** — `resources/views/errors/{404,422,500,503}.blade.php` dengan
   bahasa Indonesia dan tombol "Kembali ke katalog". Pakai layout shop
   supaya tidak terlihat seperti halaman error Laravel mentah.

4. **SEO & share** — di `layouts/shop.blade.php`: `og:title`, `og:description`,
   `og:type`. Description: "Jajanan kelas: pisang nugget dan es maboo.
   Pesan dari HP, bayar QRIS atau tunai, diantar ke kelas."

5. **README.md** — setup lokal (clone, `composer install`, `.env`,
   `npm install && npm run build`, `php artisan migrate --seed`,
   `php artisan storage:link`, `php artisan serve`), kredensial admin default
   (**dan admonisi untuk ganti password**), cara setup Midtrans sandbox,
   catatan deploy ke shared hosting.

6. **Bersihkan** — `grep -rn "dd(\|dump(\|var_dump\|TODO\|FIXME"` di
   `app/`, `resources/`, `database/`, `routes/`. Nol hasil.

7. **`php artisan optimize:clear`** lalu jalankan semua test.

**Verify (WAJIB semua):**

```powershell
php artisan test
```

Harus: semua hijau.

```
php artisan optimize:clear
npm run build
php artisan serve
```

Lalu cek manual:
- [ ] Katalog di 360px, 390px, 430px — tidak ada horizontal scroll
- [ ] Katalog di 768px dan 1280px — layout tidak aneh
- [ ] Checkout QRIS penuh dengan sandbox key
- [ ] Checkout tunai
- [ ] Status berubah real-time
- [ ] Admin CRUD produk + upload gambar
- [ ] Admin ubah status + transisi tidak valid ditolak
- [ ] Dashboard angkanya benar
- [ ] `prefers-reduced-motion` → tidak ada animasi
- [ ] Tidak ada emoji sebagai ikon di mana pun
- [ ] Font yang dipakai ter-load: Fraunces (judul) + Plus Jakarta Sans (body)
- [ ] Kontak DevTools → throttling "Slow 3G" → halaman katalog < 3 detik

```powershell
git add -A
git status
```

Review diff. Pastikan `.env` tidak ikut ter-commit (ada di `.gitignore`).

**Commit:** `chore: polish, empty states, error pages, and README`

---

## Urutan Eksekusi & Dependensi

```
Task 1  (scaffold)
   ↓
Task 2  (enum, migrasi, model)
   ↓
Task 3  (seeder)          ← butuh Task 2
   ↓
Task 4  (token, layout)   ← independen
   ↓
Task 5  (katalog)         ← butuh Task 2, 4
   ↓
Task 6  (factory)         ← butuh Task 2
   ↓
Task 7  (keranjang)       ← butuh Task 2, 4
   ↓
Task 8  (checkout)        ← butuh Task 2, 6, 7
   ↓
Task 9  (midtrans)        ← butuh Task 2, 8
   ↓
Task 10 (status)          ← butuh Task 2, 8
   ↓
Task 11 (auth admin)      ← butuh Task 1
   ↓
Task 12 (CRUD produk)     ← butuh Task 2, 11
   ↓
Task 13 (pesanan admin)   ← butuh Task 2, 11
   ↓
Task 14 (dashboard)       ← butuh Task 2, 11
   ↓
Task 15 (polish)          ← semua
```

Task 4, 6, 11 bisa dikerjakan paralel. Sisanya berurutan.

## Catatan Risiko untuk Shakshi

| Risiko | Task | Mitigasi |
|---|---|---|
| Composer gagal, PHP 8.4 belum compatible dengan Laravel 12 | 1 | `laravel/laravel:^11.0` sebagai fallback |
| GD/Imagick tidak aktif di PHP Laragon | 12 | Cek `php -m` di Task 1, install ekstensi bila perlu |
| `test()` global function tidak ada | 5 | `php artisan pest:install` (Task 1) |
| `beforeEach` tidak ada | 5 | `tests/Pest.php` — `uses(TestCase::class)->in('Feature')` |
| Snapshot test gagal karena `pivot` | 8 | Pakai `assertDatabaseHas`, bukan `assertJsonSnapshot` |
| `public/storage` symlink gagal di Windows | 1 | `php artisan storage:link` manual, cek file muncul |
| Upload test gagal di Windows | 12 | `UploadedFile::fake()->image()` bukan file asli |
| `config('midtrans.production')` string `"false"` | 1 | `MIDTRANS_PRODUCTION=false` di `.env` dibaca boolean, jangan string |
| Order ID Midtrans bentrok | 9 | `order_id` = `kode` order yang sudah unik, tidak pernah dipakai ulang |
| Notifikasi Midtrans masuk tapi order sudah `batal` | 9 | Guard: hanya update kalau status masih `menunggu_bayar` |

## Checklist Kriteria Selesai (dari spec §15)

- [ ] Katalog tampil benar 360px – 1280px
- [ ] Pelanggan bisa memesan, membayar (simulasi & produksi), melihat status
- [ ] Admin bisa login, CRUD produk, ubah status pesanan
- [ ] Semua test feature lulus
- [ ] Tidak ada `dd()`, `var_dump()`, atau TODO
- [ ] `.env.example` memuat variabel Midtrans
- [ ] `README.md` menjelaskan setup & deploy
