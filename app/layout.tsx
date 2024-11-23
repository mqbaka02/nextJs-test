import '@/app/ui/global.css';
import { Metadata } from 'next';
import { inter } from './ui/fonts';

export const metadata: Metadata= {
  title: {
    template: "%s | Acme dashboard",
    default: "NextJs test"
  },
  description: "This is a first take on NextJs.",
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh')
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ `${inter.className} antialiased` }>{children}</body>
    </html>
  );
}
