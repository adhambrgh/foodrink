<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Setiap test di folder Feature memakai Tests\TestCase (Laravel di-bind ke
| app) plus RefreshDatabase supaya database test dibersihkan di awal tiap
| test. Folder Unit tidak di-bind ke app karena tidak butuh booting Laravel.
|
*/

pest()->extend(Tests\TestCase::class)
    ->use(Illuminate\Foundation\Testing\RefreshDatabase::class)
    ->in('Feature');
