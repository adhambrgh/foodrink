'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog } from './Dialog';
import LoadingScreen from './LoadingScreen';
import { formatCurrency } from '@/lib/utils';
import {
  ReceiptHeroCard,
  ReceiptItemRow,
  ReceiptDetailGrid,
  ReceiptNextSteps,
  ReceiptActions,
} from './index';
import { Printer } from 'lucide-react';

interface OrderItem {
  product_id: string;
  qty: number;
  price_snapshot: number;
  name_snapshot: string;
}

interface OrderDetail {
  id: string;
  total: number;
  address: string;
  notes: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

type Variant = 'cod' | 'paid' | 'pending' | 'failed';

const getVariant = (paymentMethod: string, paymentStatus: string): Variant => {
  if (paymentMethod === 'cod') return 'cod';
  if (paymentStatus === 'paid') return 'paid';
  if (paymentStatus === 'pending') return 'pending';
  return 'failed';
};

export function OrderDetailModal({
  orderId,
  onClose,
}: {
  orderId: string | null;
  onClose: () => void;
}) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();

        if (res.ok && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || 'Pesanan tidak ditemukan');
        }
      } catch {
        setError('Gagal memuat data pesanan');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handlePrint = () => {
    if (!receiptRef.current || !order) return;

    const printContent = receiptRef.current.outerHTML;
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Popup diblokir. Izinkan popup untuk mencetak struk.');
      return;
    }

    const createdDate = new Date(order.created_at).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Struk Pesanan ${order.id.slice(0, 8)}</title>
          <link rel="stylesheet" href="/components/ui/print-receipt.css" />
        </head>
        <body>
          <div class="receipt-container">
            <div class="print-header">
              <h1>Foodrink</h1>
              <p>Struk Pesanan #${order.id.slice(0, 8)}</p>
              <p>${createdDate}</p>
            </div>
            <div class="print-items">
              ${order.order_items
                .map(
                  (item) => `
                <div class="print-item">
                  <div>
                    <div class="print-item-name">${item.name_snapshot}</div>
                    <div class="print-item-qty-price">${formatCurrency(item.price_snapshot)} × ${item.qty}</div>
                  </div>
                  <div class="print-item-total">${formatCurrency(item.price_snapshot * item.qty)}</div>
                </div>
              `
                )
                .join('')}
            </div>
            <div class="print-total">
              <span>Total</span>
              <span>${formatCurrency(order.total)}</span>
            </div>
            <div class="print-details">
              <div><span>Alamat</span><span>${order.address}</span></div>
              ${order.notes ? `<div><span>Catatan</span><span>${order.notes}</span></div>` : ''}
              <div><span>Metode Bayar</span><span>${order.payment_method.toUpperCase()}</span></div>
              <div><span>Status</span><span>${order.payment_status === 'paid' ? 'Lunas' : order.payment_status === 'pending' ? 'Menunggu' : 'Gagal'}</span></div>
            </div>
            <div class="print-footer">
              Terima kasih telah berbelanja di Foodrink
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!orderId) return null;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose} title="Detail Pesanan" maxWidth="lg">
        <div className="flex min-h-[300px] items-center justify-center">
          <LoadingScreen />
        </div>
      </Dialog>
    );
  }

  if (error || !order) {
    return (
      <Dialog
        open={true}
        onOpenChange={onClose}
        title="Detail Pesanan"
        maxWidth="lg"
        description={error || 'Pesanan tidak ditemukan'}
      >
        <div className="px-5 py-8 text-center">
          <p className="text-red-600 mb-4">{error || 'Pesanan tidak ditemukan'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Tutup
          </button>
        </div>
      </Dialog>
    );
  }

  const variant = getVariant(order.payment_method, order.payment_status);
  const formattedDate = new Date(order.created_at).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Dialog
      open={true}
      onOpenChange={onClose}
      title={`Detail Pesanan #${order.id.slice(0, 8)}`}
      maxWidth="lg"
    >
      <div
        ref={receiptRef}
        className="bg-white"
        style={{ maxWidth: '100%' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              variant === 'paid' ? 'bg-green-100 text-green-700' :
              variant === 'cod' ? 'bg-blue-100 text-blue-700' :
              variant === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {variant === 'paid' ? 'Lunas' :
               variant === 'cod' ? 'COD' :
               variant === 'pending' ? 'Menunggu Bayar' : 'Gagal'}
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-100 text-text text-sm font-medium hover:bg-neutral-200 transition-colors"
            aria-label="Cetak Struk"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Struk</span>
          </button>
        </div>

        <ReceiptHeroCard
          variant={variant}
          orderId={order.id}
          total={order.total}
        />

        <section className="px-5 py-5 border-b border-neutral-100">
          <h3 className="font-medium text-text flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Item Pesanan
          </h3>
          <div className="space-y-3 border-t border-neutral-100 pt-3">
            {order.order_items.map((item, idx) => (
              <ReceiptItemRow
                key={idx}
                name={item.name_snapshot}
                qty={item.qty}
                price={item.price_snapshot}
                subtotal={item.price_snapshot * item.qty}
              />
            ))}
          </div>
          <div className="border-t border-neutral-100 pt-3 mt-3 flex justify-between font-bold text-lg">
            <span className="text-text">Total</span>
            <span className="text-primary tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </section>

        <section className="px-5 py-5 border-b border-neutral-100">
          <ReceiptDetailGrid
            tanggal={formattedDate}
            alamat={order.address}
            catatan={order.notes}
            metodeBayar={order.payment_method}
          />
        </section>

        <section className="px-5 py-5">
          <ReceiptNextSteps variant={variant} />
        </section>

        <div className="px-5 py-4 border-t border-neutral-100 bg-neutral-50">
          <ReceiptActions orderId={order.id} receiptRef={receiptRef} />
        </div>
      </div>
    </Dialog>
  );
}