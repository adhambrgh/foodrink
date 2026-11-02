import BottomNav from '@/components/customer/bottom-nav';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="pb-20 bg-surface min-h-screen">{children}</main>
      <BottomNav />
    </>
  );
}