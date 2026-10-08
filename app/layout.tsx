import type { Metadata, Viewport } from 'next';
import { SITE_URL } from '@/lib/seo';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Hablemos30min · Consulta de 30 minutos con Yankiel', template: '%s · Hablemos30min' },
  description: 'Una consulta de 30 minutos con Yankiel para hablar de inteligencia artificial, sitios web, aplicaciones y diseño. 49 USD, pago único. En español.',
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = { themeColor: '#ffffff', colorScheme: 'light' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
