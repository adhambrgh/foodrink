'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [swipedId, setSwipedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchNotifs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!mounted) return;

      setNotifs(data || []);
      setLoading(false);
    };

    fetchNotifs();

    return () => {
      mounted = false;
    };
  }, []);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    setSwipedId(null);
  };

  const typeIcon = (type: string) => type === 'promo' ? '🎉' : type === 'order' ? '📦' : 'ℹ️';
  const typeColor = (type: string) => type === 'promo' ? 'bg-orange-100 text-orange-800' : type === 'order' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700';

  if (loading) return <LoadingScreen />;

  return (
    <main className="flex min-h-screen flex-col bg-surface px-4 pt-safe pb-28">
      <header className="mb-5 flex items-center justify-between border-b border-black/5 pb-3">
        <Link href="/akun" prefetch={true} aria-label="Kembali ke akun" className="rounded-full p-2 text-text transition-colors hover:bg-surface-variant">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Foodrink</p>
          <h1 className="font-sans text-lg leading-tight text-text">Notifikasi</h1>
        </div>
        <div className="w-10" />
      </header>

      {notifs.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Bell className="mb-4 h-12 w-12 text-text-muted/30" />
          <p className="text-text-muted">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => {
            const isSwiped = swipedId === n.id;
            const startXRef = useRef<number>(0);

            const onTouchStart = (e: React.TouchEvent) => { startXRef.current = e.touches[0].clientX; };
            const onTouchMove = (e: React.TouchEvent) => {
              const dx = e.touches[0].clientX - startXRef.current;
              if (dx < -10) setSwipedId(n.id); else if (dx > 10) setSwipedId(null);
            };
            const onTouchEnd = () => { if (Math.abs(startXRef.current) < 50) setSwipedId(null); };

            const onMouseDown = (e: React.MouseEvent) => {
              startXRef.current = e.clientX;
              const move = (me: MouseEvent) => {
                const dx = me.clientX - startXRef.current;
                if (dx < -10) setSwipedId(n.id); else if (dx > 10) setSwipedId(null);
              };
              const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
              document.addEventListener('mousemove', move);
              document.addEventListener('mouseup', up);
            };

            return (
              <div key={n.id}
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                className={`relative flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 shadow-sm transition-transform duration-200 ${n.is_read ? '' : 'bg-blue-50'} ${isSwiped ? '-translate-x-20' : ''}`}
                style={{ transform: isSwiped ? 'translateX(-80px)' : 'translateX(0)' }}
              >
                <span className="text-xl flex-shrink-0" role="img" aria-label={n.type}>{typeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={`font-medium text-text ${n.is_read ? '' : 'font-semibold'}`} style={{ fontSize: '0.95rem' }}>{n.title}</h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${typeColor(n.type)}`}>{n.type}</span>
                  </div>
                  <p className="text-sm text-text-muted mt-0.5 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-text-muted mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: localeId })}</p>
                </div>
                {!isSwiped && !n.is_read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 rounded text-text-muted hover:text-primary hover:bg-primary/5" aria-label="Tandai dibaca">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {isSwiped && (
                  <div className="absolute right-0 top-0 bottom-0 w-20 flex items-center justify-center bg-red-500">
                    <button onClick={() => deleteNotif(n.id)} className="text-white" aria-label="Hapus">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}