"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  Heart,
  Share2,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import ReviewList from "@/components/customer/review-list";
import StarRating from "@/components/customer/star-rating";
import { formatCurrency } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";

type ActionMode = "cart" | "buy";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  stock: number;
  categories?: { name: string; icon?: string }[] | null;
};

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingStats, setRatingStats] = useState({
    average: 0,
    total: 0,
    distribution: [0, 0, 0, 0, 0],
  });
  const [activeTab, setActiveTab] = useState<"detail" | "review">("detail");
  const [quantityDialog, setQuantityDialog] = useState<ActionMode | null>(null);
  const [quantityInput, setQuantityInput] = useState("1");
  const [notice, setNotice] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const checkFavorite = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .maybeSingle();

      if (data) setIsFavorite(true);
    };
    checkFavorite();
  }, [id]);

  const toggleFavorite = async () => {
    if (favLoading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirectTo=/${id}`);
      return;
    }

    setFavLoading(true);
    if (isFavorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', id);
      if (!error) setIsFavorite(false);
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, product_id: id });
      if (!error) setIsFavorite(true);
    }
    setFavLoading(false);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [{ data, error: productError }, { getProductReviewStats }] =
          await Promise.all([
            supabase
              .from("products")
              .select(
                "id, name, description, price, image_url, stock, categories(name, icon)",
              )
              .eq("id", id)
              .single(),
            import("@/lib/supabase/reviews"),
          ]);

        if (productError) throw productError;
        const stats = await getProductReviewStats(id);

        if (active) {
          setProduct(data as unknown as Product);
          setRatingStats(stats);
        }
      } catch (err) {
        if (active)
          setError(err instanceof Error ? err.message : "Gagal memuat produk");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const closeQuantityDialog = () => {
    setQuantityDialog(null);
    setQuantityInput("1");
  };

  const handleAddToCart = async (quantity: number) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirectTo=/${id}`);
      return false;
    }

    const { addToCart } = await import("@/lib/supabase/cart-actions");
    const result = await addToCart(id, quantity);
    if (result.error) {
      setNotice(result.error);
      return false;
    }

    setNotice(`${quantity} menu masuk ke keranjang.`);
    return true;
  };

  const submitQuantity = async () => {
    if (!product || !quantityDialog) return;

    const quantity = Number(quantityInput);
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > product.stock
    ) {
      setNotice(`Jumlah harus antara 1 sampai ${product.stock}.`);
      return;
    }

    const mode = quantityDialog;
    const added = await handleAddToCart(quantity);
    closeQuantityDialog();
    if (added && mode === "buy") router.push("/keranjang");
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/images/logo.jpeg"
            alt="Foodrink"
            width={80}
            height={80}
            className="rounded-full animate-pulse"
          />
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-surface px-4 text-center">
        <div>
          <p className="text-sm text-red-600">
            {error || "Produk tidak ditemukan."}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 text-sm font-semibold text-primary hover:underline"
          >
            Kembali
          </button>
        </div>
      </main>
    );
  }

  const average = ratingStats.total ? ratingStats.average : 0;
  const maxDistribution = Math.max(...ratingStats.distribution, 1);
  const productCategories = product.categories;
  const categoryName = Array.isArray(productCategories)
    ? productCategories[0]?.name
    : (productCategories as { name: string } | null | undefined)?.name;

  return (
    <main className="min-h-screen bg-[#fff8f5] pb-36 text-[#2b211d]">
      <header className="sticky top-0 z-30 border-b border-[#eadbd3] bg-[#fff8f5]/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl items-center">
          <button
            onClick={() => router.back()}
            aria-label="Kembali"
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-[#2b211d] transition hover:bg-[#f1e4dd] active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate font-display text-base font-bold">
            Detail menu
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-4 pt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <span className="rounded-full bg-primary-light px-3 py-1 text-[11px] font-bold text-primary-dark shadow-sm">
                {categoryName}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() =>
                navigator.share?.({
                  title: product.name,
                  url: window.location.href,
                })
              }
              aria-label="Bagikan menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#5e4d44] shadow-[0_2px_8px_rgba(83,49,33,0.08)] transition hover:text-[#a94716] active:scale-95"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={toggleFavorite}
              disabled={favLoading}
              aria-label={isFavorite ? "Hapus dari favorit" : "Simpan favorit"}
              className={`flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(83,49,33,0.08)] transition active:scale-95 disabled:opacity-50 ${isFavorite ? "text-red-500" : "text-[#8a756b] hover:text-[#a94716]"}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.15rem] bg-[#eadbd3] shadow-[0_8px_24px_rgba(83,49,33,0.1)]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="h-full w-full object-cover"
              priority
              sizes="100%"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#8a756b]">
              Foto belum tersedia
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#2b211d]/30 to-transparent" />
        </div>

        <section className="-mt-2 relative mx-1 rounded-[1rem] bg-white px-5 py-5 shadow-[0_5px_18px_rgba(83,49,33,0.08)]">
          <h2 className="font-display text-[1.45rem] font-bold leading-tight tracking-[-0.02em]">
            {product.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <p className="text-xl font-bold text-[#a94716]">
              {formatCurrency(product.price)}
            </p>
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 fill-[#d97728] text-[#d97728]" />
              <span className="text-[#8a756b]">
                ({ratingStats.total} ulasan)
              </span>
            </div>
          </div>
          <p className="mt-3 max-w-prose text-sm leading-6 text-[#725e54]">
            {product.description || "Belum ada deskripsi untuk menu ini."}
          </p>
        </section>

        <div className="mt-7 flex rounded-xl bg-[#eadfd8] p-1">
          <button
            onClick={() => setActiveTab("detail")}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${activeTab === "detail" ? "bg-white text-[#a94716] shadow-sm" : "text-[#795b4b]"}`}
          >
            Detail menu
          </button>
          <button
            onClick={() => setActiveTab("review")}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${activeTab === "review" ? "bg-white text-[#a94716] shadow-sm" : "text-[#795b4b]"}`}
          >
            Ulasan
          </button>
        </div>

        {activeTab === "detail" ? (
          <section className="mt-4 space-y-4">
            <div className="rounded-xl border border-[#eadbd3] bg-white p-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#a94716]">
                Tentang menu
              </p>
              <p className="text-sm leading-6 text-[#725e54]">
                Nikmati menu ini dengan porsi yang pas, harga yang jelas, dan
                stok yang diperbarui langsung dari Foodrink.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#f4ebe6] p-4">
                <Clock3 className="mb-2 h-5 w-5 text-[#a94716]" />
                <p className="text-xs text-[#8a756b]">Perkiraan siap</p>
                <p className="mt-1 text-sm font-bold text-[#3a2b25]">
                  Saat pesanan diproses
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mt-4 space-y-4">
            <div className="rounded-xl bg-white p-5 shadow-[0_3px_12px_rgba(83,49,33,0.06)]">
              <div className="flex items-center gap-5">
                <div className="min-w-[90px] text-center">
                  <StarRating
                    rating={average}
                    readonly
                    size={15}
                    className="justify-center"
                  />
                  <p className="mt-1 text-xs text-[#8a756b]">
                    {ratingStats.total} ulasan
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3, 2, 1].map((score) => {
                    const count = ratingStats.distribution[score - 1];
                    const width = `${(count / maxDistribution) * 100}%`;
                    return (
                      <div
                        key={score}
                        className="flex items-center gap-2 text-xs text-[#8a756b]"
                      >
                        <span className="w-3">{score}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eee3dc]">
                          <div
                            className="h-full rounded-full bg-[#d97728]"
                            style={{ width }}
                          />
                        </div>
                        <span className="w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <ReviewList productId={product.id} />
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-[#eadbd3] bg-[#fff8f5]/95 px-4 py-3 shadow-[0_-8px_22px_rgba(83,49,33,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-xl gap-3">
          <button
            onClick={() => setQuantityDialog("cart")}
            disabled={product.stock <= 0}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50"
          >
            <ShoppingBag className="h-4 w-4" /> Keranjang
          </button>
          <button
            onClick={() => setQuantityDialog("buy")}
            disabled={product.stock <= 0}
            className="h-11 flex-1 rounded-xl bg-[#2b211d] text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,33,29,0.3)] transition hover:bg-[#1a1210] active:scale-[0.98] disabled:opacity-50"
          >
            Beli </button>
        </div>
      </div>

      {notice && (
        <button
          onClick={() => setNotice(null)}
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-full bg-[#2b211d] px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
        >
          {notice}
        </button>
      )}

      {quantityDialog && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#2b211d]/45 px-4 pb-24 sm:items-center sm:pb-4">
          <div className="w-full max-w-sm rounded-[1.25rem] bg-[#fff8f5] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a94716]">
                  Atur pesanan
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-[#3a2b25]">
                  {quantityDialog === "cart"
                    ? "Tambah ke keranjang"
                    : "Beli"}
                </h3>
              </div>
              <button
                onClick={closeQuantityDialog}
                aria-label="Tutup"
                className="rounded-full p-2 text-[#8a756b] hover:bg-[#eadfd8]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label
              className="text-xs font-bold uppercase tracking-[0.12em] text-[#8a756b]"
              htmlFor="quantity"
            >
              Jumlah menu
            </label>
            <input
              id="quantity"
              type="number"
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              min="1"
              max={product.stock}
              autoFocus
              className="mt-2 h-12 w-full rounded-lg border border-[#d9c5ba] bg-white px-4 text-center text-lg font-bold text-[#3a2b25] outline-none focus:border-[#a94716] focus:ring-2 focus:ring-[#a94716]/15"
            />
            <p className="mt-2 text-xs text-[#8a756b]">
              Stok tersedia: {product.stock}
            </p>
            <button
              onClick={submitQuantity}
              className="mt-5 h-12 w-full rounded-xl bg-[#2b211d] text-sm font-bold text-white shadow-[0_4px_12px_rgba(43,33,29,0.3)] transition hover:bg-[#1a1210]"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
