import '../styles/globals.css';
import { DM_Sans, Instrument_Serif } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
  preload: true,
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-instrument-serif',
  display: 'swap',
  preload: true,
});

export const metadata = {
  title: 'FoodDrink',
  description: 'Mobile-first food & drink ordering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="bg-surface text-text min-h-screen font-body antialiased">
        {children}
      </body>
    </html>
  );
}

