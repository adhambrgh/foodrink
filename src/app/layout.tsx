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
        {children}
      </body>
    </html>
  );
}

