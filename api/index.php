<?php

/**
 * Titik masuk serverless Vercel.
 *
 * Vercel hanya menjalankan berkas di bawah folder /api sebagai function,
 * jadi front controller Laravel yang aslinya di public/ dipanggil dari sini.
 * Seluruh request diarahkan ke file ini lewat `routes` di vercel.json.
 */
require __DIR__.'/../public/index.php';
