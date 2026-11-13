import '../styles/globals.css';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
});

export const metadata = {
  title: 'FoodDrink',
  description: 'Mobile-first food & drink ordering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="bg-surface text-text min-h-screen font-poppins antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-white rounded-md"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}

