import { Suspense } from 'react';
import BookingConfirmation from '@/components/booking-confirmation';
import { privateMetadata } from '@/lib/seo';

export const metadata = privateMetadata('/confirmacion', 'Confirmación de tu reserva', 'Consulta privada del estado y los detalles de tu reserva en Hablemos30min.');

export default function ConfirmationPage() {
  return <Suspense fallback={<main className="h30-result-page"><div className="h30-result"><p role="status">Consultando tu reserva…</p></div></main>}><BookingConfirmation /></Suspense>;
}
