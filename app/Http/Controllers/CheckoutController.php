<?php

namespace App\Http\Controllers; // namespace kontroler utama

use App\Enums\Jurusan; // enum jurusan
use App\Enums\KodeKelas; // enum kode kelas
use App\Enums\StatusOrder; // enum status order
use App\Enums\TingkatKelas; // enum tingkat kelas
use App\Models\Order; // model order
use App\Models\Product; // model produk
use App\Models\Siswa; // model siswa
use Illuminate\Http\Request; // request HTTP
use Illuminate\Support\Facades\DB; // facade DB
use Illuminate\Support\Facades\Http; // facade HTTP
use Illuminate\Support\Facades\Log; // facade Log
use Illuminate\Support\Str; // helper Str
use Illuminate\Validation\Rule; // aturan validasi

/**
 * Alur checkout pesanan: verifikasi keranjang, buat record Order,
 * integrasi Snap Midtrans (QRIS/VA) atau mode bayar Tunai saat antar,
 * serta menangani webhook callback dari server Midtrans.
 */
class CheckoutController extends Controller // kontroler checkout
{
    public function index(Request $request) // tampilkan halaman checkout
    {
        $cart = $this->keranjangSiswa($request); // ambil keranjang siswa

        if (empty($cart)) { // cek keranjang kosong
            $this->kosongkanKeranjang($request); // kosongkan keranjang

            return redirect()->route('katalog') // redirect ke katalog
                ->with('galat', 'Keranjang kosong, tidak bisa checkout.'); // pesan keranjang kosong
        }

        // Order harus selalu punya tujuan antar. Kalau session penerima
        // kosong, berarti pembeli membuka /checkout langsung tanpa lewat
        // prepare, jadi data penerima belum pernah tervalidasi.
        if (! session('penerima.nama') || ! session('penerima.ruang')) { // validasi session penerima
            $this->kosongkanKeranjang($request); // kosongkan keranjang

            return redirect()->route('keranjang') // redirect ke keranjang
                ->with('galat', 'Lengkapi data penerima dulu, baru bisa lanjut bayar.'); // pesan lengkapi penerima
        }

        // Gratis antar ke kelas: total = subtotal, tanpa ongkir.
        $total = collect($cart)->sum(fn ($item) => $item['harga'] * $item['jumlah']); // hitung total belanja

        // Tunai: uangnya diterima petugas saat mengantar, jadi tidak ada
        // transaksi daring yang perlu dibuat. Order langsung masuk proses.
        if ($this->bayarTunai($request)) { // cek bayar tunai
            $order = $this->buatOrder($request, $cart, $total, Order::BAYAR_TUNAI); // buat order tunai
            $this->kurangiStok($order); // kurangi stok produk
            $this->kosongkanKeranjang($request); // kosongkan keranjang

            return view('shop.checkout', [ // render view checkout tunai
                'cart' => $cart, // kirim data keranjang
                'total' => $total, // kirim total bayar
                'order' => $order, // kirim data order
                'snapToken' => null, // tanpa snap token
                'snapUrl' => null, // tanpa snap URL
                'clientKey' => null, // tanpa client key
                'finishUrl' => null, // tanpa finish URL
                'errorUrl' => null, // tanpa error URL
            ]);
        }

        // Pesanan dicatat lebih dulu supaya ada riwayatnya, walau pembeli
        // ternyata membatalkan pembayaran di popup Midtrans.
        $order = $this->buatOrder($request, $cart, $total); // buat order QRIS

        $snapToken = $this->createMidtransTransaction($order, $total); // buat transaksi Midtrans

        // Token gagal: transaksi di Midtrans tidak pernah ada, jadi order
        // ini juga tidak pernah berarti apa-apa. Dihapus, bukan ditandai
        // batal, supaya tidak jadi sampah di daftar.
        if (! $snapToken) { // cek token gagal
            $order->delete(); // hapus order gagal
            $this->kosongkanKeranjang($request); // kosongkan keranjang

            return redirect()->route('keranjang') // redirect ke keranjang
                ->with('galat', 'Gagal terhubung ke pembayaran Midtrans. Coba checkout lagi nanti.'); // pesan gagal Midtrans
        }

        $order->update(['snap_token' => $snapToken]); // simpan snap token

        return view('shop.checkout', [ // render view checkout QRIS
            'cart' => $cart, // kirim keranjang
            'total' => $total, // kirim total
            'order' => $order, // kirim order
            'snapToken' => $snapToken, // kirim snap token
            'snapUrl' => $this->snapUrl(), // kirim snap URL
            'clientKey' => config('services.midtrans.client_key'), // kirim client key
            'finishUrl' => route('checkout.finish'), // URL selesai bayar
            'unfinishUrl' => route('checkout.unfinish'), // URL batal bayar
            'errorUrl' => route('checkout.error'), // URL error bayar
        ]);
    }

    public function callback(Request $request) // webhook callback Midtrans
    {
        $payload = $request->all(); // ambil semua payload

        Log::info('Midtrans callback', $payload); // log callback masuk

        $orderId = $payload['order_id'] ?? null; // ambil order_id
        $statusCode = $payload['status_code'] ?? null; // ambil status_code
        $grossAmount = $payload['gross_amount'] ?? null; // ambil gross_amount
        $signatureKey = $payload['signature_key'] ?? null; // ambil signature_key
        $transactionStatus = $payload['transaction_status'] ?? null; // ambil status transaksi
        $fraudStatus = $payload['fraud_status'] ?? null; // ambil status fraud

        $serverKey = config('services.midtrans.server_key'); // ambil server key
        $expectedSignature = hash('sha512', $orderId.$statusCode.$grossAmount.$serverKey); // hitung signature harapan

        if ($signatureKey !== $expectedSignature) { // cek signature tidak cocok
            Log::warning('Midtrans signature mismatch', [ // log mismatch
                'expected' => $expectedSignature, // signature harapan
                'received' => $signatureKey, // signature diterima
            ]);

            return response('Invalid signature', 400); // tolak request invalid
        }

        $isSuccess = in_array($transactionStatus, ['capture', 'settlement']) // cek status sukses
            && ($fraudStatus === 'accept' || $fraudStatus === null); // cek fraud accept

        if ($isSuccess) { // jika pembayaran sukses
            // Callback datang dari server Midtrans, jadi tidak ada siswa yang
            // login di sini. Keranjang dikosongkan lewat pemilik order,
            // bukan lewat $request->user() yang pasti null.
            $order = $this->tandaiLunas($orderId); // tandai order lunas

            if ($order?->siswa_id) { // cek order punya siswa
                Siswa::find($order->siswa_id)?->keranjang()->first()?->kosongkan(); // kosongkan keranjang pemilik
            }

            Log::info("Order {$orderId} paid successfully"); // log sukses bayar
        } else { // jika belum sukses
            Log::info("Order {$orderId} status: {$transactionStatus}, fraud: {$fraudStatus}"); // log status pending
        }

        return response('OK'); // balas OK ke Midtrans
    }

    public function finish(Request $request) // halaman selesai bayar
    {
        $order = $this->cariOrder($request); // cari order milik siswa

        // Halaman ini dibuka dari browser, jadi statusnya dicek ulang ke
        // Midtrans. Kalau server key tidak bisa dihubungi (mis. sedang
        // develops di lokal), query string dipercaya apa adanya --
        // produksi tetap wajib verifikasi lewat server.
        if ($order && $order->status === StatusOrder::MenungguBayar && $this->sudahTerbayar($order->midtrans_order_id)) { // verifikasi status bayar
            $this->tandaiLunas($order->midtrans_order_id); // tandai lunas
            $order->refresh(); // refresh data order
            $this->kosongkanKeranjang($request); // kosongkan keranjang
        }

        $status = $request->query('status'); // ambil status dari URL

        if (! $order) { // jika order tidak ditemukan
            return view('shop.checkout-finish', [ // render finish generik
                'message' => 'Terima kasih telah berbelanja.', // pesan terima kasih
                'orderId' => $request->query('order_id'), // kirim order_id
            ]);
        }

        return view('shop.struk', [ // render struk order
            'order' => $order, // data order
            'kepala' => match ($status) { // judul sesuai status
                'pending' => 'Pembayaran lagi dulu ya', // judul pending
                default => $order->status === StatusOrder::MenungguBayar // cek masih menunggu
                    ? 'Menunggu pembayaran' // judul menunggu bayar
                    : 'Pembayaran berhasil!', // judul berhasil
            },
            'catatan' => match ($status) { // catatan sesuai status
                'pending' => 'Uangmu belum masuk. Selesaikan pembayaran sebelum batas waktunya ya.', // catatan pending
                default => $order->status === StatusOrder::MenungguBayar // cek menunggu
                    ? 'Kalau uangnya sudah keluar tapi statusnya masih nunggu, tunggu sebentar lalu refresh.' // catatan menunggu konfirmasi
                    : 'Simpan struk ini ya, biar gampang dicek sama petugas.', // catatan berhasil
            },
        ]);
    }

    public function unfinish(Request $request) // halaman batal bayar
    {
        $order = $this->cariOrder($request); // cari order siswa

        if (! $order) { // jika order tak ada
            return view('shop.checkout-finish', [ // render finish batal
                'message' => 'Pembayaran dibatalkan. Kamu bisa checkout lagi kapan saja.', // pesan batal
                'orderId' => null, // tanpa orderId
            ]);
        }

        return view('shop.struk', [ // render struk batal
            'order' => $order, // data order
            'kepala' => 'Pembayaran dibatalkan', // judul batal
            'catatan' => 'Pesanan ini belum dibayar, jadi belum kami proses. Kalau mau, checkout lagi ya.', // catatan batal
        ]);
    }

    public function error(Request $request) // halaman error bayar
    {
        $order = $this->cariOrder($request); // cari order siswa

        if (! $order) { // jika order tak ada
            return view('shop.checkout-finish', [ // render finish error
                'message' => 'Terjadi kesalahan pada pembayaran. Silakan hubungi admin.', // pesan error
                'orderId' => $request->query('order_id'), // kirim order_id
            ]);
        }

        return view('shop.struk', [ // render struk gagal
            'order' => $order, // data order
            'kepala' => 'Pembayaran gagal', // judul gagal
            'catatan' => 'Tidak bisa connect ke pembayaran. Coba lagi, atau hubungi petugas di kantin.', // catatan gagal
        ]);
    }

    public function prepare(Request $request) // siapkan checkout
    {
        $cart = $request->json('cart', []); // ambil cart dari JSON

        if (! is_array($cart) || $cart === []) { // cek cart kosong
            return response()->json([ // balas error
                'error' => 'Cart empty', // kode error
                'pesan' => 'Keranjangmu kosong, jadi tidak bisa lanjut bayar.', // pesan kosong
            ], 400); // status 400
        }

        $susun = $this->susunCart($cart); // susun cart valid

        // Produk habis dibuang semua: tidak ada yang bisa dibeli, jadi
        // jangan sampai pengguna klik bayar.
        if (empty($susun)) { // cek hasil susun kosong
            return response()->json([ // balas stok habis
                'error' => 'Stok habis', // kode habis
                'pesan' => 'Semua jajan di keranjang sudah habis. Coba pilih yang lain.', // pesan habis
            ], 422); // status 422
        }

        $penerima = $this->validasiPenerima($request); // validasi data penerima
        $caraBayar = $this->validasiCaraBayar($request); // validasi cara bayar

        // Persistensi keranjang pindah ke database supaya isi keranjang tidak
        // hilang saat ganti perangkat atau cookie dihapus.
        $keranjang = $request->user('siswa')->keranjang()->firstOrCreate(); // dapatkan keranjang DB
        $keranjang->isiDengan($susun); // simpan isi keranjang

        $request->session()->put('penerima', $penerima); // simpan penerima ke session
        $request->session()->put('cara_bayar', $caraBayar); // simpan cara bayar ke session

        // Isi keranjang dikembalikan supaya browser bisa menandai
        // localStorage-nya sebagai milik akun. Tanpa ini, cache browser
        // tetap jadi sumber dan bisa menimpa keranjang akun di visits
        // berikutnya.
        return response()->json([ // balas sukses prepare
            'ok' => true, // status ok
            'cart' => $keranjang->isi(), // kirim isi keranjang
        ]);
    }

    /**
     * True kalau pesanan ini dibayar tunai, yaitu uang diterima petugas saat
     * mengantar. Nilai diambil dari session hasil validasi `prepare()`.
     */
    private function bayarTunai(Request $request): bool // cek bayar tunai
    {
        return $request->session()->get('cara_bayar') === Order::BAYAR_TUNAI; // bandingkan session tunai
    }

    /**
     * Cara bayar hanya boleh dua: tunai atau non tunai. Nilai lain ditolak
     * di server supaya tidak ada order dengan metode yang tidak dikenal.
     */
    private function validasiCaraBayar(Request $request): string // validasi cara bayar
    {
        $data = $request->validate([ // validasi input cara bayar
            'cara_bayar' => ['nullable', Rule::in([Order::BAYAR_TUNAI, Order::BAYAR_QRIS])], // harus tunai/QRIS
        ], [], [
            'cara_bayar' => 'metode pembayaran', // label atribut
        ]);

        return $data['cara_bayar'] ?? Order::BAYAR_QRIS; // default QRIS
    }

    /**
     * Data penerima wajib lengkap sebelum lanjut ke pembayaran: nama dan
     * ruangan menentukan ke mana jajan diantar, kelas/jurusan/kode jadi
     * petunjuk tambahan untuk petugas.
     *
     * Nilai yang tetap dikirim tapi tidak ada di daftar tetap ditolak,
     * supaya tidak muncul "XI RPL A" yang bedanya cuma spasi.
     *
     * @return array{nama: string, tingkat: string, jurusan: string, kode_kelas: string, ruang: string}
     */
    private function validasiPenerima(Request $request): array // validasi penerima
    {
        // Spasi di awal/akhir dibuang dulu supaya "   " tetap dianggap
        // kosong oleh aturan required, bukan lolos sebagai isian sah.
        $request->merge([ // trim semua penerima
            'penerima' => collect($request->input('penerima') ?? []) // ambil input penerima
                ->map(fn ($nilai) => is_string($nilai) ? trim($nilai) : $nilai) // trim tiap string
                ->all(), // jadi array
        ]);

        $data = $request->validate([ // validasi field penerima
            'penerima' => ['required', 'array'], // penerima wajib array
            'penerima.nama' => ['required', 'string', 'max:120'], // nama wajib
            'penerima.tingkat' => ['required', Rule::enum(TingkatKelas::class)], // tingkat enum
            'penerima.jurusan' => ['required', Rule::enum(Jurusan::class)], // jurusan enum
            'penerima.kode_kelas' => ['required', Rule::enum(KodeKelas::class)], // kode kelas enum
            'penerima.ruang' => ['required', 'string', 'max:60'], // ruang wajib
        ], [], [
            'penerima' => 'data penerima', // label penerima
            'penerima.nama' => 'nama penerima', // label nama
            'penerima.tingkat' => 'tingkat kelas', // label tingkat
            'penerima.jurusan' => 'jurusan', // label jurusan
            'penerima.kode_kelas' => 'kode kelas', // label kode kelas
            'penerima.ruang' => 'nama ruangan', // label ruang
        ]);

        $penerima = $data['penerima']; // ambil array penerima

        return [ // kembalikan data rapi
            // Huruf besar di depan supaya rapi di daftar antrean admin.
            'nama' => Str::title($penerima['nama']), // format nama title
            'tingkat' => $penerima['tingkat'], // simpan tingkat
            'jurusan' => $penerima['jurusan'], // simpan jurusan
            'kode_kelas' => $penerima['kode_kelas'], // simpan kode kelas
            'ruang' => Str::upper($penerima['ruang']), // format ruang uppercase
        ];
    }

    /**
     * Keranjang datang dari browser, jadi harga dan stok tidak boleh
     * dipercaya. Ambil ulang dari database, jumlah dipotong sesuai stok
     * yang benar-benar tersedia. Produk habis dibuang.
     *
     * @param  array<int, mixed>  $cart
     * @return array<int, array<string, mixed>>
     */
    private function susunCart(array $cart): array // susun cart aman
    {
        $minta = collect($cart) // koleksi cart browser
            ->mapWithKeys(fn ($item) => [(int) ($item['id'] ?? 0) => (int) ($item['jumlah'] ?? 0)]) // petakan id->jumlah
            ->filter(fn ($jumlah, $id) => $id > 0 && $jumlah > 0); // filter id/jumlah valid

        if ($minta->isEmpty()) { // cek permintaan kosong
            return []; // kembalikan kosong
        }

        $produk = Product::query() // query produk
            ->whereIn('id', $minta->keys()) // filter id diminta
            ->get() // ambil produk
            ->keyBy('id'); // key by id

        $hasil = []; // wadah hasil

        foreach ($minta as $id => $jumlah) { // loop tiap permintaan
            $p = $produk->get($id); // ambil produk

            if (! $p || ! $p->tersedia || $p->habis) { // cek tidak tersedia/habis
                continue; // lewati produk ini
            }

            $hasil[] = [ // tambah ke hasil
                'id' => $p->id, // id produk
                'nama' => $p->nama, // nama produk
                'harga' => $p->harga, // harga DB
                'jumlah' => min($jumlah, $p->stok), // batasi stok
                'stok' => $p->stok, // info stok
                'gambar' => $p->foto_fallback, // gambar fallback
            ];
        }

        return $hasil; // kembalikan hasil susun
    }

    /**
     * Keranjang milik siswa yang sedang login, diambil dari database.
     *
     * Tidak lagi dari session: begitu siswa login, isi keranjangnya
     * ikut ke akun, jadi ganti HP atau clears cache tidak menghilangkan
     * jajan yang sudah dipilih.
     *
     * @return list<array{id: int, nama: string, harga: int, jumlah: int, stok: int, gambar: ?string}>
     */
    private function keranjangSiswa(Request $request): array // ambil keranjang DB
    {
        return $request->user('siswa')->keranjang()->firstOrCreate()->isi(); // ambil isi keranjang
    }

    /**
     * Kosongkan keranjang siswa yang sedang login.
     *
     * Hanya untuk halaman yang dilindungi guard `siswa`. Kalau session
     * sudah tidak ada (mis. cookie kedaluwarsa di tengah alur), diam-diam
     * dilewati: lebih baik keranjang tidak terkosongkan daripada fatal error
     * yang menggagalkan pembayaran yang sedang diproses.
     */
    private function kosongkanKeranjang(Request $request): void // kosongkan keranjang
    {
        // `first()`, bukan `firstOrCreate()`: mengosongkan keranjang tidak
        // perlu membuat baris baru kalau memang belum pernah dibuat.
        $request->user('siswa')?->keranjang()->first()?->kosongkan(); // kosongkan jika ada
    }

    /**
     * Buat order beserta rinciannya. Data penerima diambil dari session
     * yang sudah divalidasi `prepare()`, jadi di sini tidak perlu
     * memvalidasi ulang -- kalaurones tidak lengkap, `index()` sudah
     * mengembalikan siswa ke halaman keranjang.
     *
     * Order tunai langsung Lunas, QRIS menunggu callback pembayaran.
     */
    private function buatOrder(Request $request, array $cart, int $total, ?string $metodeBayar = null): Order // buat order baru
    {
        $metodeBayar ??= Order::BAYAR_QRIS; // default QRIS
        $tunai = $metodeBayar === Order::BAYAR_TUNAI; // cek tunai
        $penerima = $request->session()->get('penerima', []); // ambil penerima session

        return DB::transaction(function () use ($request, $cart, $total, $metodeBayar, $tunai, $penerima) { // transaksi DB
            $order = Order::create([ // buat order
                'siswa_id' => $request->user('siswa')->id, // id siswa
                'nama' => $penerima['nama'], // nama penerima
                'tingkat' => $penerima['tingkat'] ?? null, // tingkat kelas
                'jurusan' => $penerima['jurusan'] ?? null, // jurusan
                'kode_kelas' => $penerima['kode_kelas'] ?? null, // kode kelas
                'ruang' => $penerima['ruang'], // ruang antar
                'cara_ambil' => Order::CARA_AMBIL_ANTAR, // cara ambil antar
                'metode_bayar' => $metodeBayar, // metode bayar
                'status' => $tunai ? StatusOrder::Lunas : StatusOrder::MenungguBayar, // status sesuai bayar
                'total' => $total, // total bayar
                'midtrans_order_id' => $this->midtransOrderId(), // ID Midtrans unik
                'batas_bayar' => $tunai ? null : now()->addMinutes((int) config('services.midtrans.batas_bayar_menit')), // batas bayar QRIS
            ]);

            foreach ($cart as $item) { // loop item keranjang
                $order->items()->create([ // buat order item
                    'product_id' => $item['id'], // id produk
                    'nama' => $item['nama'], // nama produk
                    'harga' => $item['harga'], // harga satuan
                    'jumlah' => $item['jumlah'], // jumlah beli
                    'subtotal' => $item['harga'] * $item['jumlah'], // hitung subtotal
                ]);
            }

            return $order; // kembalikan order baru
        });
    }

    /**
     * Potong stok sesuai rincian pesanan. Dipanggil hanya setelah pembayaran
     * QRIS terkonfirmasi, supaya barang tidak tertahan kalau pembeli menekan
     * "batal" di popup Midtrans.
     */
    private function kurangiStok(Order $order): void // kurangi stok produk
    {
        $order->loadMissing('items'); // muat relasi items

        foreach ($order->items as $item) { // loop tiap item
            Product::where('id', $item->product_id) // cari produk
                ->where('stok', '>=', $item->jumlah) // cek stok cukup
                ->decrement('stok', $item->jumlah); // kurangi stok
        }
    }

    /**
     * Tandai QRIS sudah dibayar. Idempoten: Midtrans bisa mengirim callback
     * lebih dari sekali, jadi stok hanya dipotong pada transisi status
     * pertama dari MenungguBayar ke Lunas.
     *
     * Order yang barusan ditransisikan dikembalikan supaya pemanggil bisa
     * tahu siapa pemiliknya. Callback kedua untuk order yang sama
     * mengembalikan null, karena tidak ada transisi baru.
     */
    private function tandaiLunas(?string $midtransOrderId): ?Order // tandai lunas
    {
        if (blank($midtransOrderId)) { // cek ID kosong
            return null; // kembalikan null
        }

        $order = Order::where('midtrans_order_id', $midtransOrderId)->first(); // cari order

        if (! $order || $order->status !== StatusOrder::MenungguBayar) { // cek bukan menunggu bayar
            return null; // kembalikan null
        }

        $order->update([ // update status
            'status' => StatusOrder::Lunas, // jadi lunas
            'batas_bayar' => null, // hapus batas bayar
        ]);

        $this->kurangiStok($order); // kurangi stok

        return $order; // kembalikan order lunas
    }

    /**
     * Minta snap token ke Midtrans. Null berarti transaksi tidak pernah
     * dibuat, jadi pemanggil boleh membuang order-nya tanpa sisa.
     */
    private function createMidtransTransaction(Order $order, int $total): ?string // minta token Midtrans
    {
        $order->loadMissing('items'); // muat items order

        try { // coba request Midtrans
            $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '') // auth server key
                ->post($this->midtransApiUrl().'/snap/v1/transactions', [ // POST snap transaction
                    'transaction_details' => [ // detail transaksi
                        'order_id' => $order->midtrans_order_id, // ID order Midtrans
                        'gross_amount' => $total, // total bayar
                    ],
                    'customer_details' => [ // detail pelanggan
                        'first_name' => Str::limit($order->nama, 40, ''), // nama dibatasi 40
                    ],
                    'item_details' => $order->items->map(fn ($item) => [ // rincian item
                        'id' => (string) $item->product_id, // id produk string
                        'price' => $item->harga, // harga satuan
                        'quantity' => $item->jumlah, // jumlah
                        'name' => Str::limit($item->nama, 40, ''), // nama dibatasi 40
                    ])->all(), // jadi array
                ]);
        } catch (\Throwable $e) { // tangkap error koneksi
            Log::error('Gagal menghubungi Midtrans saat membuat transaksi', [ // log gagal konek
                'order' => $order->midtrans_order_id, // ID order
                'pesan' => $e->getMessage(), // pesan error
            ]);

            return null; // kembalikan null
        }

        if (! $response->successful()) { // cek response gagal
            Log::error('Midtrans menolak pembuatan transaksi', [ // log ditolak
                'order' => $order->midtrans_order_id, // ID order
                'status' => $response->status(), // status HTTP
                'body' => $response->body(), // body response
            ]);

            return null; // kembalikan null
        }

        $token = $response->json('token'); // ambil token

        return filled($token) ? $token : null; // kembalikan token atau null
    }

    /**
     * Tanya status ke Midtrans. Halaman `finish` dipanggil dari browser,
     * jadi statusnya dicek ulang ke server; query string tidak dipercaya
     * sebagai bukti pembayaran.
     */
    private function sudahTerbayar(?string $midtransOrderId): bool // cek sudah bayar
    {
        if (blank($midtransOrderId)) { // cek ID kosong
            return false; // belum bayar
        }

        try { // coba cek status
            $response = Http::withBasicAuth((string) config('services.midtrans.server_key'), '') // auth server key
                ->get($this->midtransApiUrl().'/v2/'.$midtransOrderId.'/status'); // GET status order
        } catch (\Throwable $e) { // tangkap error
            Log::warning('Gagal cek status ke Midtrans', [ // log warning
                'order' => $midtransOrderId, // ID order
                'pesan' => $e->getMessage(), // pesan error
            ]);

            return false; // anggap belum bayar
        }

        if (! $response->successful()) { // cek gagal
            return false; // belum bayar
        }

        $status = $response->json('transaction_status'); // ambil status transaksi
        $fraud = $response->json('fraud_status'); // ambil fraud status

        return in_array($status, ['capture', 'settlement'], true) // cek capture/settlement
            && ($fraud === 'accept' || $fraud === null); // cek fraud accept
    }

    private function midtransApiUrl(): string // URL API Midtrans
    {
        return config('services.midtrans.is_production') // cek mode produksi
            ? 'https://api.midtrans.com' // URL produksi
            : 'https://api.sandbox.midtrans.com'; // URL sandbox
    }

    private function midtransOrderId(): string // generate ID Midtrans
    {
        return 'foodrink-'.Str::lower(Str::random(12)); // prefix + random
    }

    /**
     * Cari pesanan milik siswa yang sedang login. `order_id` dari Midtrans
     * dipakai dulu karena itu yang dikirim balik saat pembayaran, lalu kode
     * struk internal sebagai cadangan.
     *
     * Ownership dicek lewat siswa_id, bukan daftar kode di session: begitu
     * siswa punya akun, halamannya berlaku di perangkat mana pun, bukan
     * cuma browser yang dipakai saat memesan.
     */
    private function cariOrder(Request $request): ?Order // cari order siswa
    {
        $orderId = $request->query('order_id'); // ambil order_id URL
        $kode = $request->query('kode'); // ambil kode URL
        $siswaId = $request->user('siswa')?->id; // ambil ID siswa login

        $cari = fn (?string $kolom, ?string $nilai) => filled($nilai) // closure cari order
            ? Order::with('items')->where($kolom, $nilai)->first() // cari per kolom
            : null; // atau null

        $order = $cari('midtrans_order_id', $orderId) ?? $cari('kode', $kode); // coba dua kunci

        // Nomor pesanan orang lain tidak boleh terbuka hanya karena
        // kebetulan ditebak atau bocor dari riwayat browser lain.
        if (! $order || $order->siswa_id !== $siswaId) { // cek kepemilikan
            return null; // bukan milik siswa
        }

        return $order; // kembalikan order
    }

    private function snapUrl(): string // URL snap JS
    {
        return config('services.midtrans.is_production') // cek produksi
            ? 'https://app.midtrans.com/snap/snap.js' // URL produksi
            : 'https://app.sandbox.midtrans.com/snap/snap.js'; // URL sandbox
    }
}
