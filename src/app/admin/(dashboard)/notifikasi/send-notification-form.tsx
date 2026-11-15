'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { sendNotification } from './actions';

export function SendNotificationForm({ customers }: { customers: { id: string; name?: string }[] }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set('title', title);
    fd.set('message', message);
    fd.set('type', type);
    fd.set('target', target);
    const res = await sendNotification(fd);
    setLoading(false);
    if (res?.error) alert(res.error);
    else alert(`Notifikasi terkirim ke ${res?.count ?? 0} penerima`);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl bg-surface-card border border-border rounded-xl p-4 md:p-6 space-y-5">
      <div>
        <label htmlFor="target" className="block text-sm font-medium text-text mb-1.5">Penerima</label>
        <select id="target" value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm">
          <option value="all">Semua customer</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name || customer.id}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-text mb-1.5">Tipe</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm">
          <option value="info">Info</option><option value="promo">Promo</option><option value="order">Pesanan</option>
        </select>
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-text mb-1.5">Judul</label>
        <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm" placeholder="Contoh: Promo spesial hari ini" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-text mb-1.5">Pesan</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={500} rows={5} className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm resize-y" placeholder="Tulis pesan notifikasi..." />
      </div>
      <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
        <Send className="w-4 h-4" /> {loading ? 'Mengirim...' : 'Kirim Notifikasi'}
      </button>
    </form>
  );
}