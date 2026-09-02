import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://orden-al-azar.msv7m44xdz.chatgpt.site'),
  title: 'Orden al azar',
  description:
    'Mezcla una lista de nombres durante cinco segundos y genera un orden aleatorio con Fisher–Yates.',
  openGraph: {
    title: 'Orden al azar',
    description: 'Mezcla los nombres.',
    images: ['/og.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orden al azar',
    description: 'Mezcla los nombres.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
