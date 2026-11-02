import '../styles/globals.css';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import SupabaseProvider from '@/components/providers/supabase-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['600','700'] });

export const metadata = {
  title: 'FoodDrink',
  description: 'Mobile-first food & drink ordering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="bg-surface text-text min-h-screen">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}

