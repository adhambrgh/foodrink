import '../styles/globals.css';
import { Poppins, Playfair_Display } from 'next/font/google';
import SupabaseProvider from '@/components/providers/supabase-provider';

const poppins = Poppins({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-poppins' });
const display = Playfair_Display({ subsets: ['latin'], weight: ['700'], variable: '--font-display' });

export const metadata = {
  title: 'FoodDrink',
  description: 'Mobile-first food & drink ordering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${poppins.variable} ${display.variable}`}>
      <body className="bg-surface text-text min-h-screen font-poppins">
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}

