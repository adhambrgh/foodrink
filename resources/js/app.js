import './bootstrap';

/**
 * Cart state management
 *
 * Sumber kebenaran ada di server, lewat `prepare`. localStorage cuma
 * cache supaya katalog (yang terbuka untuk tamu) tidak perlu request
 * setiap kali ada yang diklik.
 *
 * Begitu siswa login, isi keranjang ikut ke akun: bukan digabung dengan
 * cache browser, tapi diganti seluruhnya oleh isi server.
 */
const CART_KEY = 'foodrink_cart';
const SERVER_KEY = 'foodrink_cart_server';

function readCache(kunci) {
    try {
        return JSON.parse(localStorage.getItem(kunci)) || [];
    } catch {
        return [];
    }
}

function getCart() {
    return readCache(SERVER_KEY).length ? readCache(SERVER_KEY) : readCache(CART_KEY);
}

function saveCart(cart) {
    // Cache browser ditulis hanya kalau keranjang masih milik satu akun
    // saja (tamu). Begitu isinya berasal dari server, localStorage
    // berhenti jadi sumber supaya tidak menimpa keranjang akun.
    const dariServer = cart.some((item) => item._dariServer);

    if (dariServer) {
        localStorage.setItem(SERVER_KEY, JSON.stringify(cart));
    } else {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }

    window.dispatchEvent(new CustomEvent('cart:update', { detail: cart }));
}

/**
 * Tandai isi keranjang sebagai milik akun, lalu buang cache browser.
 * Dipanggil setelah server menyalin keranjang ke akun siswa.
 */
function adoptServerCart(cart) {
    const ditandai = cart.map((item) => ({ ...item, _dariServer: true }));
    localStorage.setItem(SERVER_KEY, JSON.stringify(ditandai));
    // Cache tamu dibuang supaya tidak muncul lagi setelah logout.
    localStorage.removeItem(CART_KEY);
    // Event dikirim dulu supaya bar katalog di tab ini langsung menyesuaikan
    // jumlahnya dari cart yang baru (detail), bukan re-read localStorage
    // yang belum selesai ditulis.
    window.dispatchEvent(new CustomEvent('cart:update', { detail: ditandai }));
    updateCartBadge();
    renderCart(ditandai);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.jumlah, 0);
}

function updateCartBadge() {
    const badge = document.querySelector('.lencana');
    const count = getCartCount();
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
    const srText = document.querySelector('.hanya-layar-baca');
    if (srText) {
        srText.textContent = `${count} item di keranjang`;
    }
}

/**
 * Add product to cart
 */
function addToCart(produk) {
    const cart = getCart();
    const existing = cart.find(item => item.id === produk.id);
    // Stok null = produk ini belum punya info stok (keranjang lama).
    const stok = typeof produk.stok === 'number' ? produk.stok : null;

    if (stok === 0) {
        showFlash('galat', `${produk.nama} habis, ntar aja ya.`);
        return;
    }

    if (existing && stok !== null && existing.jumlah >= stok) {
        showFlash('galat', `Stok ${produk.nama} tinggal ${stok}.`);
        return;
    }

    if (existing) {
        existing.jumlah += 1;
        if (stok !== null) existing.stok = stok;
    } else {
        cart.push({
            id: produk.id,
            nama: produk.nama,
            harga: produk.harga,
            jumlah: 1,
            stok,
            gambar: produk.gambar ?? null,
        });
    }

    saveCart(cart);
    updateCartBadge();
    showPopupTambahKeranjang(produk);
}

/**
 * Update item quantity
 *
 * Perubahan dikirim ke server, lalu daftar dirender ulang dari balasan
 * server. Jadi angka yang tampil selalu hasil perhitungan server, bukan
 * hasil additions di browser yang bisa tertinggal kalau stok sudah
 * berubah karena pembeli lain.
 */
async function updateQuantity(id, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);

    if (!item) return;

    // Tidak boleh lewat stok yang dipasang admin.
    if (delta > 0 && typeof item.stok === 'number' && item.jumlah >= item.stok) {
        showFlash('galat', `Stok ${item.nama} tinggal ${item.stok}.`);
        return;
    }

    const nama = item.nama;
    item.jumlah += delta;

    const hilang = item.jumlah <= 0;
    if (hilang) cart.splice(cart.indexOf(item), 1);

    const ok = await kirimKeServer(cart);

    if (hilang && ok) showFlash('sukses', `${nama} dihapus dari keranjang`);
}

/**
 * Remove item entirely
 */
async function removeItem(id) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);

    if (!item) return;

    cart.splice(cart.indexOf(item), 1);

    // Flash sukses hanya setelah server benar-benar menyimpan. Kalau
    // gagal, kirimKeServer sudah mengembalikan isi lama, jadi men-write
    // "dihapus" di sini akan berbohong: barangnya muncul lagi.
    if (await kirimKeServer(cart)) {
        showFlash('sukses', `${item.nama} dihapus`);
    }
}

/**
 * Kirim isi keranjang ke server dan pakai balasannya sebagai isi
 * keranjang yang benar. Kalau gagal, kembalikan tampilan ke isi
 * terakhir yang diketahui supaya angka tidak sampai benar-benar beda
 * dengan yang tersimpan.
 *
 * @returns {Promise<boolean>} true kalau isi keranjang tersimpan
 *   (di server, atau di browser untuk tamu yang belum login).
 */
async function kirimKeServer(cart) {
    const url = document.body.dataset.keranjangSinkron;
    const sebelum = getCart();

    // Tanpa endpoint sinkron (tamu belum login), isi hanya bisa hidup
    // di browser. Itu wajar: keranjang tamu memang belum punya akun.
    if (!url) {
        saveCart(cart);
        updateCartBadge();
        renderCart(cart);
        return true;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
            },
            body: JSON.stringify({ cart }),
        });

        // 401 = middleware auth:siswa menolak karena belum login. Bukan
        // kegagalan: jatuh ke penyimpanan browser dan anggap berhasil,
        // supaya tamu bisa hapus/tambah tanpa dimintai login duluan.
        if (response.status === 401) {
            saveCart(cart);
            updateCartBadge();
            renderCart(cart);
            return true;
        }

        if (response.status === 419) {
            saveCart(sebelum);
            updateCartBadge();
            renderCart(sebelum);
            showFlash('galat', 'Sesi kamu habis. Muat ulang halaman ya.');
            return false;
        }

        if (!response.ok) throw new Error('Server menolak perubahan keranjang.');

        const data = await response.json();
        if (Array.isArray(data.cart)) {
            adoptServerCart(data.cart);
        } else {
            saveCart(cart);
            updateCartBadge();
            renderCart(cart);
        }
        return true;
    } catch (e) {
        saveCart(sebelum);
        updateCartBadge();
        renderCart(sebelum);
        showFlash('galat', 'Gagal menyimpan ke server. Tersimpan di browser saja.');
        return false;
    }
}

/**
 * Render cart page
 */
/**
 * Render ulang daftar keranjang dari isi yang sudah dikonfirmasi server.
 *
 * Daftar item dirender penuh di sini karena setelah ini yang tampil adalah
 * data server: harga dan stok tidak boleh berasal dari cache browser.
 * Yang tidak disentuh adalah pilihan cara bayar dan tombolnya, yang
 * sengaja diluar area ini -- rebuilding pernah menghapus radi-nya.
 */
function renderCart(cart = getCart()) {
    const list = document.querySelector('.keranjang__list');
    const ringkasan = document.querySelector('.keranjang__ringkasan');
    if (!list || !ringkasan) return;

    if (cart.length === 0) {
        list.innerHTML = `
            <li class="kosong kosong--kartu">
                <div class="kosong__ikon" aria-hidden="true">
                    <svg class="ikon" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h16l-1.4 10.6A2 2 0 0 1 16.6 20H7.4a2 2 0 0 1-2-1.4L4 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M9.5 12.5v4M14.5 12.5v4"/></svg>
                </div>
                <h2>Keranjang masih kosong</h2>
                <p>Yuk pilih jajan dulu di <a href="${window.location.origin}/">katalog</a>.</p>
            </li>
        `;
        ringkasan.classList.add('keranjang__ringkasan--kosong');
        const totalKosong = document.getElementById('keranjang-total');
        if (totalKosong) {
            totalKosong.dataset.total = '0';
            totalKosong.dataset.jumlah = '0';
        }
        return;
    }

    ringkasan.classList.remove('keranjang__ringkasan--kosong');

    list.innerHTML = cart.map(item => {
        // Tombol tambah mati begitu sudah mencapai stok yang tersedia.
        const maksimal = item.jumlah >= item.stok;

        return `
        <li class="keranjang__item" data-id="${item.id}">
            <div class="keranjang__foto" aria-hidden="true">
                ${item.gambar
                    ? `<img src="${item.gambar}" alt="" loading="lazy" class="keranjang__img">`
                    : ''}
            </div>
            <div class="keranjang__isi">
                <div class="keranjang__nama">${escapeHtml(item.nama)}</div>
                <div class="keranjang__harga">Rp ${item.harga.toLocaleString('id-ID')} <span>&times; ${item.jumlah}</span></div>
                <div class="keranjang__kuantitas">
                    <button type="button" class="tombol-ikon btn-kurang" aria-label="Kurangi ${escapeHtml(item.nama)}" data-id="${item.id}">
                        <svg class="ikon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
                    </button>
                    <span class="keranjang__jumlah">${item.jumlah}</span>
                    <button type="button" class="tombol-ikon btn-tambah" aria-label="Tambah ${escapeHtml(item.nama)}" data-id="${item.id}" ${maksimal ? 'disabled' : ''}>
                        <svg class="ikon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                    </button>
                    ${maksimal ? `<span class="keranjang__sisa">stok tinggal ${item.stok}</span>` : ''}
                </div>
            </div>
            <div class="keranjang__kanan">
                <div class="harga keranjang__subtotal">Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')}</div>
                <button type="button" class="tombol-ikon tombol-ikon--halus keranjang__hapus" aria-label="Hapus ${escapeHtml(item.nama)}" data-id="${item.id}">
                    <svg class="ikon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7"/><path d="M6.5 7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7"/></svg>
                </button>
            </div>
        </li>
    `;
    }).join('');

    // Gratis antar ke kelas, jadi total = subtotal. Angkanya disimpan di
    // data attribute supaya hilangin item (yang tidak lewat fetch kalau
    // session sudah habis) tetap bisa memperbarui total.
    const total = cart.reduce((sum, item) => sum + item.harga * item.jumlah, 0);
    const totalEl = document.getElementById('keranjang-total');
    if (totalEl) {
        totalEl.dataset.total = String(total);
        totalEl.dataset.jumlah = String(cart.reduce((s, i) => s + i.jumlah, 0));
    }

    segarkanRingkasan();
}

/**
 * Tulis ulang baris total saja. Pilihan cara bayar dan tombol bayar
 * sengaja tidak disentuh supaya radio tidak hilang tiap kali total berubah.
 */
function segarkanRingkasan() {
    const totalEl = document.getElementById('keranjang-total');
    if (!totalEl) return;

    const total = Number(totalEl.dataset.total || 0);
    const jumlah = Number(totalEl.dataset.jumlah || 0);

    totalEl.innerHTML = `
        <div class="keranjang__baris keranjang__baris--total">
            <span>Total <em>${jumlah} jajan &middot; gratis antar</em></span>
            <span class="harga">Rp ${total.toLocaleString('id-ID')}</span>
        </div>`;
}

/**
 * Simple flash message
 */
function showFlash(type, message) {
    const flashContainer = document.createElement('div');
    flashContainer.style.cssText = 'position:fixed;bottom:var(--s4);left:50%;transform:translateX(-50%);z-index:1000;';
    const icons = {
        sukses: '<svg class="ikon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
        galat: '<svg class="ikon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    };
    const colors = {
        sukses: 'var(--hijau)',
        galat: 'var(--bata)',
    };
    flashContainer.innerHTML = `
        <div class="flash flash--${type}" role="alert" style="background:${colors[type]};color:white;padding:var(--s2) var(--s3);border-radius:var(--radius,8px);display:flex;align-items:center;gap:var(--s1);box-shadow:var(--shadow-lg,0 10px 15px -3px rgb(0 0 0 / 0.1));">
            ${icons[type]}
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(flashContainer);
    setTimeout(() => {
        flashContainer.style.opacity = '0';
        flashContainer.style.transition = 'opacity 0.3s';
        setTimeout(() => flashContainer.remove(), 300);
    }, 3000);
}

/* ------------------------------------------------------------
   Popup konfirmasi di tengah halaman

   Cuma pemberitahuan: tidak ada tombol, tidak mengambil fokus, dan
   tidak memblokir klik. Tampil sebentar lalu hilang sendiri.
   ------------------------------------------------------------ */

const IKON_POPUP = {
    cek: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
};

// Popup yang lagi tampil, supaya tidak ada dua yang numpuk.
let popupAktif = null;

function escapeHtml(teks) {
    return String(teks).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);
}

function tutupPopup() {
    if (!popupAktif) return;

    const { popup, timer } = popupAktif;
    popupAktif = null;

    clearTimeout(timer);
    document.removeEventListener('keydown', onPopupKey);
    popup.classList.remove('popup--tampil');
    setTimeout(() => popup.remove(), 220);
}

function onPopupKey(e) {
    if (e.key === 'Escape') tutupPopup();
}

/**
 * Satu pintu masuk popup. Isi diserahkan sebagai HTML supaya tiap
 * pemanggil bebas menata isinya, kerangka dan tutup otomatis diurus
 * di sini. Default 1 detik karena popup ini hanya kabar singkat.
 */
function bukaPopup(isi, { durasi = 1000 } = {}) {
    tutupPopup();

    const popup = document.createElement('div');
    popup.className = 'popup';
    // Live region dibuat kosong dulu, lalu isinya masuk frame berikutnya.
    // Kalau kontennya lahir bareng region-nya, screen reader tidak
    // sempat membacanya.
    popup.setAttribute('role', 'status');
    popup.setAttribute('aria-live', 'polite');
    document.body.appendChild(popup);

    requestAnimationFrame(() => {
        // Sudah ditutup atau diganti popup lain sebelum sempat tampil.
        if (popupAktif?.popup !== popup) return;

        popup.innerHTML = `
            <div class="popup__latar"></div>
            <div class="popup__kartu">${isi}</div>
        `;
        // Entrance lewat satu keyframe: transisi CSS baru keputar.
        popup.classList.add('popup--tampil');
    });

    const timer = setTimeout(tutupPopup, durasi);
    document.addEventListener('keydown', onPopupKey);
    popupAktif = { popup, timer };
}

function showPopupTambahKeranjang(produk) {
    const total = getCartCount();
    const totalHarga = getCart().reduce((sum, item) => sum + item.harga * item.jumlah, 0);

    bukaPopup(`
        <div class="popup__ikon" aria-hidden="true">${IKON_POPUP.cek}</div>
        <p class="popup__judul">Masuk keranjang!</p>
        <p class="popup__nama">${escapeHtml(produk.nama)}</p>
        <p class="popup__info">${total} jajan di keranjang &middot; Rp ${totalHarga.toLocaleString('id-ID')}</p>
    `);
}

/**
 * Initialize katalog page: add-to-cart buttons
 */
function initKatalog() {
    document.querySelectorAll('[data-produk-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(btn.dataset.produkId, 10);
            const card = btn.closest('.produk');
            const namaEl = card?.querySelector('.produk__nama');
            const nama = namaEl?.textContent.trim() || 'Produk';
            const hargaText = card?.querySelector('.produk__harga, .harga')?.textContent || '0';
            const harga = parseInt(hargaText.replace(/[^\d]/g, ''), 10) || 0;
            const gambar = card?.querySelector('.produk__img')?.getAttribute('src') || null;
            const stok = parseInt(btn.dataset.stok, 10);

            // micro-feedback biar jelas kepencet
            btn.animate?.(
                [{ transform: 'scale(1)' }, { transform: 'scale(0.94)' }, { transform: 'scale(1)' }],
                { duration: 160, easing: 'ease-out' }
            );

            addToCart({ id, nama, harga, gambar, stok: Number.isNaN(stok) ? null : stok });
        });
    });
}

/**
 * Menu admin: sidebar di laptop, panel buka-tutup di layar sempit.
 */
function initAdminMenu() {
    const tombol = document.querySelector('[data-menu-tombol]');
    const menu = document.getElementById('admin-menu');
    if (!tombol || !menu) return;

    const tutup = () => {
        menu.classList.remove('admin__sisi--buka');
        tombol.setAttribute('aria-expanded', 'false');
    };

    tombol.addEventListener('click', () => {
        const buka = menu.classList.toggle('admin__sisi--buka');
        tombol.setAttribute('aria-expanded', buka ? 'true' : 'false');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') tutup();
    });

    // Klik di luar panel = tutup, seperti menu biasa.
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !tombol.contains(e.target)) tutup();
    });

    // Menu yang disembunyikan lewat CSS tidak boleh tetap terfokus.
    window.addEventListener('resize', () => {
        if (window.matchMedia('(min-width: 1024px)').matches) tutup();
    });
}

/**
 * Initialize keranjang page: quantity buttons, remove, checkout
 */
function initKeranjang() {
    const list = document.querySelector('.keranjang__list');
    const ringkasan = document.querySelector('.keranjang__ringkasan');
    if (!list || !ringkasan) return;

    // URL dikirim dari Blade lewat data attribute: file .js tidak bisa
    // memakai {{ route() }} karena Vite tidak memproses Blade.
    const urlPrepare = document.body.dataset.checkoutPrepare;
    const urlCheckout = document.body.dataset.checkoutIndex;
    const urlSinkron = document.body.dataset.keranjangSinkron;

    // Event delegation for quantity buttons
    list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-id]');
        if (!btn) return;

        const id = parseInt(btn.dataset.id, 10);

        if (btn.classList.contains('btn-tambah')) {
            updateQuantity(id, 1);
        } else if (btn.classList.contains('btn-kurang')) {
            updateQuantity(id, -1);
        } else if (btn.classList.contains('keranjang__hapus')) {
            removeItem(id);
        }
    });

    // Checkout button - event delegation on ringkasan (runs after renderCart)
    ringkasan.addEventListener('click', async (e) => {
        const btn = e.target.closest('#checkout-btn');
        if (!btn) return;

        e.preventDefault();
        const cart = getCart();
        if (cart.length === 0) {
            showFlash('galat', 'Keranjang kosong');
            return;
        }

        // Data penerima wajib lengkap sebelum lanjut ke pembayaran. Validasi
        // dicek di sini dulu supaya pembeli langsung tahu field mana yang
        // kurang, tanpa perlu dikirim ke server lalu bounced kembali.
        const WAJIB = [
            { id: 'nama-penerima', pesan: 'Tulis nama penerima dulu.' },
            { id: 'ruang', pesan: 'Tulis nama ruangan tujuan.' },
            { id: 'tingkat', pesan: 'Pilih tingkat kelas.' },
            { id: 'jurusan', pesan: 'Pilih jurusan.' },
            { id: 'kode-kelas', pesan: 'Pilih kode kelas.' },
        ];

        const bersihkanGalat = () => {
            document.querySelectorAll('[data-galat]').forEach((el) => {
                el.hidden = true;
                el.textContent = '';
            });
            document.querySelectorAll('.input--galat').forEach((el) => {
                el.classList.remove('input--galat');
                el.removeAttribute('aria-invalid');
            });
        };

        const cekPenerima = () => {
            bersihkanGalat();

            let pertamaKosong = null;

            WAJIB.forEach(({ id, pesan }) => {
                const field = document.getElementById(id);
                if (!field) return;

                const kosong = !field.value?.trim();
                const galat = document.getElementById(`galat-${id}`);

                if (!kosong) return;
                field.classList.add('input--galat');
                field.setAttribute('aria-invalid', 'true');
                if (galat) {
                    galat.textContent = pesan;
                    galat.hidden = false;
                }
                if (!pertamaKosong) pertamaKosong = field;
            });

            if (pertamaKosong) {
                pertamaKosong.focus();
                // Fokus pertama sering gagal kalau field-nya ada di luar viewport;
        // scrollIntoView memastikan fieldnya benar-benar terlihat.
                pertamaKosong.scrollIntoView({ block: 'center', behavior: 'smooth' });
                return false;
            }

            return true;
        };

        // Teks yang diklik: hilang begitu pembelinya mulai memperbaiki.
        WAJIB.forEach(({ id }) => {
            document.getElementById(id)?.addEventListener('input', bersihkanGalat);
            document.getElementById(id)?.addEventListener('change', bersihkanGalat);
        });

        // Gagal di sini berarti tidak ada request yang dikirim, jadi tombol
        // tidak pernah berubah jadi "Memproses..." dan pembeli bisa langsung
        // memperbaikinya.
        if (!cekPenerima()) return;

        const penerima = {
            nama: document.getElementById('nama-penerima')?.value?.trim() ?? '',
            ruang: document.getElementById('ruang')?.value?.trim() ?? '',
            tingkat: document.getElementById('tingkat')?.value ?? '',
            jurusan: document.getElementById('jurusan')?.value ?? '',
            kode_kelas: document.getElementById('kode-kelas')?.value ?? '',
        };

        // Cara bayar menentukan halaman berikutnya: non tunai masuk ke popup
        // Midtrans, tunai langsung jadi pesanan yang menunggu petugas.
        const caraBayar = document.querySelector('input[name="cara_bayar"]:checked')?.value || 'qris';

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Memproses...';

        try {
            const response = await fetch(urlPrepare, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Tanpa header ini Laravel menganggap permintaan ini
                    // Wants HTML, jadi error validasi dibalas redirect 302
                    // dan fetch ikut mengikutinya -- hasilnya 200 halaman
                    // HTML yang lolos sebagai "sukses".
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    cart,
                    penerima,
                    cara_bayar: caraBayar,
                }),
            });

            if (response.ok) {
                // Server sudah mengembalikan isi keranjang yang sah.
                // Tandai cache browser sebagai milik akun sebelum pindah,
                // supaya halaman berikutnya tidak memakai cache lama.
                const data = await response.json().catch(() => null);
                if (data?.cart) adoptServerCart(data.cart);
                window.location.href = urlCheckout;
                return;
            }

            // Server yang menolak (stok habis, isian tidak lengkap, nilai
            // di luar daftar) -- tampilkan alasannya, bukan pesan generik.
            const data = await response.json().catch(() => null);

            if (!data) {
                throw new Error(
                    response.status === 419
                        ? 'Sesi halaman sudah kedaluwarsa. Refresh dulu ya.'
                        : `Server balas ${response.status}, bukan JSON.`
                );
            }

            // Pesan validasi Laravel datang di `errors`; `message`-nya cuma
            // kalimat umum yang tidak menyebut field yang salah.
            const rincian = Object.entries(data.errors ?? {})
                .map(([field, pesan]) => `${field.split('.').pop()}: ${pesan[0]}`)
                .join(' ');

            throw new Error(rincian || data.pesan || data.message || 'Gagal menyiapkan checkout');
        } catch (err) {
            showFlash('galat', 'Gagal checkout: ' + err.message);
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

/**
 * Init on DOM ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Flash auto-hide
    document.querySelectorAll('[data-flash]').forEach((banner) => {
        setTimeout(() => {
            banner.classList.add('flash--sembunyi');
            setTimeout(() => banner.remove(), 300);
        }, 4000);
    });

    segarkanRingkasan();
    updateCartBadge();

    // Page-specific init
    if (document.querySelector('.halaman-katalog')) {
        initKatalog();
    }
    if (document.querySelector('.halaman-keranjang')) {
        initKeranjang();

        const list = document.querySelector('.keranjang__list');

        if (list?.dataset.belumLogin) {
            // Tamu: server memang mengirim keranjang kosong. Yang tampil
            // adalah isi localStorage dari katalog, jadi barang yang sudah
            // dipilih tidak hilang hanya karena belum punya akun.
            renderCart(getCart());
        } else {
            // Siswa login: daftar sudah benar dari server, cache justru
            // bisa berisi keranjang akun lain. Yang dilakukan hanya
            // menyamakan cache lokal dengan isi server supaya tombol
            // "Bayar & pesan" punya cart untuk dikirim.
            let dariServer = [];
            try {
                dariServer = JSON.parse(list?.dataset.cart || '[]');
            } catch {}

            if (Array.isArray(dariServer) && dariServer.length) {
                adoptServerCart(dariServer);
            } else {
                const tamu = readCache(CART_KEY);
                const urlSinkron = document.body.dataset.keranjangSinkron;
                if (tamu.length && urlSinkron) {
                    renderCart(tamu);
                    fetch(urlSinkron, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
                        },
                        body: JSON.stringify({ cart: tamu }),
                    })
                        .then((r) => (r.ok ? r.json() : null))
                        .then((data) => { if (Array.isArray(data?.cart)) adoptServerCart(data.cart); })
                        .catch(() => {});
                }
            }
        }
    }
    if (document.body.classList.contains('admin')) {
        initAdminMenu();
    }

    // Listen for cart updates from other tabs
    window.addEventListener('cart:update', updateCartBadge);
});