'use client';

import Link from 'next/link';
import UiIcon from '@/components/ui-icon';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { meetingLabel } from './booking-widget';

type Booking = { id: string; name: string; startAt: string; timezone: string; meetingType: string; meetingUrl?: string | null; phone: string };
type Result = { state: 'loading' } | { state: 'error'; message: string } | { state: 'pending' } | { state: 'expired' } | { state: 'review' } | { state: 'closed'; status: 'completed' | 'no_show' | 'cancelled' } | { state: 'paid'; booking: Booking };

function validMeetingUrl(value?: string | null) { if (!value) return null; try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : null; } catch { return null; } }

export default function BookingConfirmation() {
  const params = useSearchParams();
  const session = params.get('session_id');
  const [result, setResult] = useState<Result>({ state: 'loading' });
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    if (!session || !/^cs_[a-zA-Z0-9_]{10,256}$/.test(session)) { setResult({ state: 'error', message: 'Este enlace no contiene una reserva válida. Abre el enlace de confirmación que recibiste después del pago.' }); return; }
    async function check() {
      try {
        const response = await fetch(`/api/booking?session_id=${encodeURIComponent(session!)}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('No pudimos consultar tu reserva. Vuelve a intentarlo en un momento.');
        const data = await response.json() as { status: string; booking?: Booking };
        if (!active) return;
        if ((data.status === 'paid' || data.status === 'confirmed') && data.booking && Number.isFinite(Date.parse(data.booking.startAt))) { setResult({ state: 'paid', booking: data.booking }); return; }
        if (data.status === 'expired') { setResult({ state: 'expired' }); return; }
        if (data.status === 'payment_review') { setResult({ state: 'review' }); return; }
        if (data.status === 'completed' || data.status === 'no_show' || data.status === 'cancelled') { setResult({ state: 'closed', status: data.status }); return; }
        if (data.status === 'canceled') { setResult({ state: 'closed', status: 'cancelled' }); return; }
        setResult({ state: 'pending' });
        if (++attempts < 6) timer = setTimeout(check, 3000);
      } catch { if (active && !controller.signal.aborted) setResult({ state: 'error', message: 'No pudimos consultar tu reserva. Conserva este enlace y vuelve a intentarlo; no necesitas pagar de nuevo.' }); }
    }
    void check();
    return () => { active = false; controller.abort(); if (timer) clearTimeout(timer); };
  }, [session, refresh]);

  const booking = result.state === 'paid' ? result.booking : null;
  const meetingUrl = validMeetingUrl(booking?.meetingUrl);
  function retry() { setResult({ state: 'loading' }); setRefresh(value => value + 1); }

  return <main className="h30-result-page"><Link className="h30-footer-brand" href="/">hablemos<span>30min</span></Link><section className="h30-result" aria-labelledby="result-title" aria-live="polite">
    <p className="h30-eyebrow">ESTADO DE LA RESERVA</p>
    {result.state === 'loading' && <><span className="h30-loading-ring" aria-hidden="true" /><h1 id="result-title">Revisando tu reserva.</h1><p>Comprobamos el estado del pago antes de confirmar tu consulta.</p></>}
    {result.state === 'pending' && <><div className="h30-result-symbol" aria-hidden="true"><UiIcon name="clock" /></div><h1 id="result-title">Verificando el pago.</h1><p>Tu reserva todavía no está confirmada. La verificación puede tardar unos segundos.</p><p>Conserva este enlace. Si completaste el pago, espera la confirmación antes de reservar otra vez.</p><button className="h30-button h30-primary" type="button" onClick={retry}>Actualizar estado <UiIcon name="refresh" /></button></>}
    {result.state === 'error' && <><h1 id="result-title">Consulta de la reserva</h1><p role="alert">{result.message}</p>{session && <button className="h30-button h30-primary" type="button" onClick={retry}>Volver a consultar</button>}<Link className="h30-text-link" href="/">Volver al inicio</Link></>}
    {result.state === 'expired' && <><h1 id="result-title">Este pago<br />no se completó.</h1><p>Esta sesión de pago ha terminado y no confirma una reserva. Si ya ves un cargo en tu banco, conserva el comprobante y consulta el estado antes de pagar de nuevo.</p><Link className="h30-button h30-primary" href="/#reservar">Volver a la agenda</Link></>}
    {result.state === 'review' && <><h1 id="result-title">Tu reserva necesita<br />una revisión.</h1><p>Necesitamos revisar el estado del pago antes de confirmar tu consulta. Si ya completaste el pago, conserva tu comprobante y no vuelvas a pagar.</p><a className="h30-button h30-primary" href="mailto:business@hablemos30min.online">Contactar a Hablemos30min</a><p>Escríbenos a business@hablemos30min.online con tu nombre y el correo de la reserva.</p><button className="h30-back" type="button" onClick={retry}>Consultar el estado otra vez</button></>}
    {result.state === 'closed' && <><h1 id="result-title">{result.status === 'completed' ? 'Tu consulta finalizó.' : result.status === 'cancelled' ? 'Tu reserva está cancelada.' : 'El horario de tu consulta ya pasó.'}</h1><p>{result.status === 'completed' ? 'Esta consulta figura como completada. Gracias por dedicar un espacio a tu proyecto.' : result.status === 'cancelled' ? 'Esta reserva figura como cancelada. La cancelación no implica un reembolso automático.' : 'Esta consulta figura sin asistencia. Para revisar lo ocurrido, contacta a Hablemos30min.'}</p><a className="h30-button h30-secondary" href="mailto:business@hablemos30min.online">Consultar sobre esta reserva</a><Link className="h30-text-link" href="/">Volver al inicio</Link></>}
    {booking && <><div className="h30-result-symbol" aria-hidden="true"><UiIcon name="check" /></div><h1 id="result-title">Reserva confirmada.</h1><p>{booking.name}, tu consulta está confirmada. Revisa los detalles de la cita.</p><dl className="h30-result-details"><div><dt>Tu consulta</dt><dd>{new Intl.DateTimeFormat('es', { timeZone: booking.timezone, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(booking.startAt))}<strong>{new Intl.DateTimeFormat('es', { timeZone: booking.timezone, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(booking.startAt))} · 30 minutos</strong><small>Zona horaria: {booking.timezone}</small></dd></div><div><dt>Cómo hablamos</dt><dd>{meetingLabel(booking.meetingType)}{(booking.meetingType === 'phone' || booking.meetingType === 'whatsapp') && <small>Al celular que indicaste: {booking.phone}</small>}</dd></div><div><dt>Pago confirmado</dt><dd>49 USD · Pago único</dd></div></dl><p>Revisa tu correo para los detalles y los recordatorios. Si no lo encuentras, revisa también la carpeta de correo no deseado.</p><div className="h30-result-actions"><a className="h30-button h30-primary" href={`/api/booking/calendar?session_id=${encodeURIComponent(session!)}`}>Añadir a mi calendario <UiIcon name="download" /></a>{meetingUrl && <a className="h30-button h30-secondary" href={meetingUrl} rel="noopener noreferrer" target="_blank">{booking.meetingType === 'whatsapp' ? 'Abrir WhatsApp' : 'Abrir enlace de la llamada'}</a>}</div><p className="h30-privacy-note">Conserva este enlace: contiene los detalles privados de tu cita.</p><Link className="h30-text-link" href="/">Volver al inicio</Link></>}
  </section><p className="h30-result-footnote">Hablemos30min · 30 minutos · 49 USD</p></main>;
}
