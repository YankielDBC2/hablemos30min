'use client';

import Link from 'next/link';
import UiIcon from '@/components/ui-icon';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

type Settings = { hostName: string; timezone: string; meetingType: string; bookingEnabled: boolean };
type Availability = { slots: string[]; settings: Settings; price: number; duration: number; supportedCallChannels?: string[] };
type Agenda = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: Availability };
type Details = { name: string; email: string; phone: string; callChannel: 'whatsapp' | 'phone'; topic: string; notes: string };
const zones = [['America/New_York', 'Miami · Hora del Este'], ['America/Mexico_City', 'Ciudad de México'], ['America/Bogota', 'Bogotá'], ['America/Los_Angeles', 'Los Ángeles · Hora del Pacífico'], ['Europe/Madrid', 'Madrid'], ['America/Havana', 'La Habana']];
const topics = ['Inteligencia artificial', 'Sitios web', 'Aplicaciones', 'Desarrollo', 'Diseño', 'Un poco de todo'];
const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const emptySlots: string[] = [];

export function meetingLabel(value?: string) {
  return ({ phone: 'Llamada telefónica', telephone: 'Llamada telefónica', whatsapp: 'WhatsApp', google_meet: 'Google Meet', meet: 'Google Meet', zoom: 'Zoom', pending: 'Canal por confirmar', unconfigured: 'Canal por confirmar' } as Record<string, string>)[value || ''] || 'Canal por confirmar';
}

function dateKeyWithFormatter(value: string | Date, formatter: Intl.DateTimeFormat) {
  const parts = formatter.formatToParts(new Date(value));
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}

export function dateKey(value: string | Date, timezone: string) {
  return dateKeyWithFormatter(value, new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }));
}

function longDay(key: string) { return new Intl.DateTimeFormat('es', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${key}T12:00:00Z`)); }
function slotLabel(value: string, timezone: string) { return new Intl.DateTimeFormat('es', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone }).format(new Date(value)); }
function fullSlot(value: string, timezone: string) { return new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: timezone }).format(new Date(value)); }
function moveMonth(month: string, delta: number) { const [year, number] = month.split('-').map(Number); const day = new Date(Date.UTC(year, number - 1 + delta, 1)); return `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}`; }

export default function BookingWidget() {
  const [timezone, setTimezone] = useState('America/New_York');
  const [month, setMonth] = useState(() => dateKey(new Date(), 'America/New_York').slice(0, 7));
  const [agenda, setAgenda] = useState<Agenda>({ status: 'loading' });
  const [refresh, setRefresh] = useState(0);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [details, setDetails] = useState<Details>({ name: '', email: '', phone: '', callChannel: 'whatsapp', topic: '', notes: '' });
  const [policy, setPolicy] = useState(false);
  const [checkout, setCheckout] = useState<'idle' | 'submitting'>('idle');
  const [error, setError] = useState('');
  const [canceled, setCanceled] = useState(false);
  const idempotency = useRef<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  useEffect(() => { setCanceled(new URLSearchParams(window.location.search).get('cancelado') === '1'); }, []);
  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    fetch(`/api/availability?month=${month}&timezone=${encodeURIComponent(timezone)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('No pudimos cargar la agenda. Revisa tu conexión y vuelve a intentarlo.');
        const data = await response.json() as Availability;
        if (!Array.isArray(data.slots) || !data.settings || data.price !== 4900 || data.duration !== 30 || data.slots.some(slot => typeof slot !== 'string' || !Number.isFinite(Date.parse(slot)))) throw new Error('La agenda no está disponible en este momento. Vuelve a intentarlo.');
        if (!current) return;
        setAgenda({ status: 'ready', data });
        setSelectedDay(previous => previous.startsWith(month) ? previous : (data.slots[0] ? dateKey(data.slots[0], timezone) : ''));
      }).catch((reason: unknown) => { if (current && !controller.signal.aborted) setAgenda({ status: 'error', message: reason instanceof Error ? reason.message : 'No pudimos cargar la agenda. Vuelve a intentarlo.' }); });
    return () => { current = false; controller.abort(); };
  }, [month, timezone, refresh]);

  useEffect(() => { if (previousStep.current !== step) { heading.current?.focus(); previousStep.current = step; } }, [step]);

  const available = agenda.status === 'ready' && agenda.data.settings.bookingEnabled;
  const slots = agenda.status === 'ready' && available ? agenda.data.slots : emptySlots;
  const slotsByDay = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const grouped = new Map<string, string[]>();
    for (const slot of slots) {
      const day = dateKeyWithFormatter(slot, formatter);
      const existing = grouped.get(day);
      if (existing) existing.push(slot);
      else grouped.set(day, [slot]);
    }
    return grouped;
  }, [slots, timezone]);
  const days = new Set(slotsByDay.keys());
  const daySlots = slotsByDay.get(selectedDay) ?? emptySlots;
  const selectedStillAvailable = slots.includes(selectedSlot) && new Date(selectedSlot).getTime() > Date.now();
  const [year, monthNumber] = month.split('-').map(Number);
  const monthDate = new Date(Date.UTC(year, monthNumber - 1, 1));
  const startOffset = (monthDate.getUTCDay() + 6) % 7;
  const monthDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const currentMonth = dateKey(new Date(), timezone).slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(monthDate);
  const meeting = agenda.status === 'ready' && ['whatsapp', 'phone'].includes(agenda.data.settings.meetingType) ? 'WhatsApp o teléfono' : agenda.status === 'ready' ? meetingLabel(agenda.data.settings.meetingType) : 'Consulta en español';

  function reload() { setAgenda({ status: 'loading' }); setRefresh(value => value + 1); }
  function navigateMonth(delta: number) { setAgenda({ status: 'loading' }); setMonth(moveMonth(month, delta)); setSelectedDay(''); setSelectedSlot(''); setError(''); idempotency.current = null; }
  function changeTimezone(value: string) { setAgenda({ status: 'loading' }); setTimezone(value); setSelectedDay(''); setSelectedSlot(''); setError(''); idempotency.current = null; }
  function updateDetails(field: keyof Details, value: string) { setDetails(previous => ({ ...previous, [field]: value })); idempotency.current = null; setError(''); }
  function submitDetails(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); setStep(3); }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checkout === 'submitting') return;
    if (!selectedStillAvailable) { setError('Ese horario ya no está disponible. Elige otro; conservamos tus datos.'); setStep(1); reload(); return; }
    if (!policy) return;
    idempotency.current ||= crypto.randomUUID();
    setCheckout('submitting'); setError('');
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...details, startAt: selectedSlot, timezone, acceptedPolicy: true, idempotencyKey: idempotency.current }) });
      const result = await response.json() as { url?: string; error?: string; code?: string };
      if (!response.ok) {
        if (response.status === 409) { setError('Ese horario acaba de ocuparse. Elige otro; conservamos tus datos.'); setStep(1); setSelectedSlot(''); idempotency.current = null; reload(); return; }
        if (response.status === 503) throw new Error('Las reservas están temporalmente pausadas. Conservamos tus datos para que puedas volver a intentarlo.');
        if (response.status === 429) throw new Error('Espera un momento antes de volver a intentarlo. Tus datos siguen aquí.');
        throw new Error('No pudimos abrir el pago. Revisa tus datos y vuelve a intentarlo.');
      }
      if (!result.url) throw new Error('No pudimos abrir el pago. Vuelve a intentarlo.');
      const url = new URL(result.url);
      if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') throw new Error('No pudimos abrir el pago. Vuelve a intentarlo.');
      window.location.assign(url.toString());
    } catch (reason) { setError(reason instanceof TypeError ? 'No pudimos conectar. Revisa tu conexión y vuelve a intentarlo. Tus datos siguen aquí.' : reason instanceof Error ? reason.message : 'No pudimos abrir el pago. Vuelve a intentarlo.'); }
    finally { setCheckout('idle'); }
  }

  return <section className="h30-booking-card" aria-label="Reserva una consulta de 30 minutos">
    <header className="h30-session-header"><div><h2>Consulta de 30 minutos</h2><p>Con Yankiel · En español</p></div><strong className="h30-session-price">$49<span>USD</span></strong></header>
    <div className="h30-session-meta"><span>{meeting}</span><span>Pago único</span></div>
    <div className="h30-booking-body">
      <ol className="h30-progress" aria-label="Pasos de la reserva">{['Horario', 'Tus datos', 'Revisión'].map((label, index) => <li key={label} className={step === index + 1 ? 'is-current' : step > index + 1 ? 'is-done' : ''} aria-current={step === index + 1 ? 'step' : undefined}><span aria-hidden="true">{index + 1}</span>{label}</li>)}</ol>
      {canceled && <p className="h30-notice" role="status">Volviste del pago. Tu reserva no está confirmada. Puedes elegir un horario e intentarlo de nuevo.</p>}
      {error && <p className="h30-error" role="alert">{error}</p>}
      {step === 1 && <div className="h30-step-panel">
        <div className="h30-panel-heading"><h3 ref={heading} tabIndex={-1}>Elige fecha y hora</h3><span>Hora de tu zona</span></div>
        <div className="h30-scheduler" aria-busy={agenda.status === 'loading'}>
          <div className="h30-calendar"><div className="h30-month-nav"><h4 aria-live="polite">{monthLabel}</h4><div><button type="button" className="h30-icon-button" aria-label="Mes anterior" disabled={month <= currentMonth} onClick={() => navigateMonth(-1)}><UiIcon name="chevron-left" /></button><button type="button" className="h30-icon-button" aria-label="Mes siguiente" disabled={month >= moveMonth(currentMonth, 11)} onClick={() => navigateMonth(1)}><UiIcon name="chevron-right" /></button></div></div>
            <div className="h30-weekdays" aria-hidden="true">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
            <div className="h30-calendar-grid" role="group" aria-label={`Fechas de ${monthLabel}`}>
              {Array.from({ length: startOffset }, (_, index) => <span key={`empty-${index}`} />)}
              {Array.from({ length: monthDays }, (_, index) => { const key = `${month}-${String(index + 1).padStart(2, '0')}`; return <button key={key} type="button" disabled={!days.has(key)} aria-label={`${longDay(key)}${days.has(key) ? ', horarios disponibles' : ', sin horarios disponibles'}`} aria-pressed={key === selectedDay} className={`h30-date${key === selectedDay ? ' is-selected' : ''}${key === dateKey(new Date(), timezone) ? ' is-today' : ''}`} onClick={() => { setSelectedDay(key); setSelectedSlot(''); idempotency.current = null; }}>{index + 1}</button>; })}
            </div>
            <p className="h30-calendar-key">{agenda.status === 'loading' ? 'Consultando disponibilidad…' : available ? 'Selecciona un día disponible' : 'Agenda de consultas'}</p>
          </div>
          <div className="h30-time-picker"><p className="h30-selected-day">{selectedDay && available ? longDay(selectedDay) : 'Tu espacio de 30 minutos'}</p>
            {agenda.status === 'loading' && <div className="h30-agenda-state" role="status"><span className="h30-loading-ring" aria-hidden="true" /><strong>Consultando horarios…</strong><p>Estamos consultando la agenda.</p></div>}
            {agenda.status === 'error' && <div className="h30-agenda-state" role="alert"><strong>La agenda no pudo cargar.</strong><p>{agenda.message}</p><button className="h30-button h30-secondary" type="button" onClick={reload}>Volver a intentar</button></div>}
            {agenda.status === 'ready' && !available && <div className="h30-agenda-state h30-paused" role="status"><span className="h30-pause-symbol" aria-hidden="true">II</span><strong>Agenda en pausa</strong><p>Estamos preparando las próximas consultas. Vuelve pronto para elegir tu horario.</p><span className="h30-state-note">No se realizan reservas ni pagos mientras esté pausada.</span></div>}
            {agenda.status === 'ready' && available && !slots.length && <div className="h30-agenda-state" role="status"><strong>Este mes está completo.</strong><p>No hay horarios disponibles. Prueba con otro mes.</p><button className="h30-button h30-secondary" type="button" disabled={month >= moveMonth(currentMonth, 11)} onClick={() => navigateMonth(1)}>Ver el próximo mes</button></div>}
            {agenda.status === 'ready' && available && slots.length > 0 && !selectedDay && <div className="h30-agenda-state" role="status"><strong>¿Qué día te viene bien?</strong><p>Elige una fecha para ver sus horarios.</p></div>}
            {agenda.status === 'ready' && available && selectedDay && !daySlots.length && slots.length > 0 && <div className="h30-agenda-state" role="status"><strong>Este día está completo.</strong><p>Elige otra fecha disponible.</p></div>}
            {!!daySlots.length && <div className="h30-time-slots" role="group" aria-label={`Horarios del ${longDay(selectedDay)}`}>{daySlots.map(slot => <button type="button" key={slot} aria-pressed={slot === selectedSlot} className={slot === selectedSlot ? 'is-selected' : ''} onClick={() => { setSelectedSlot(slot); idempotency.current = null; setError(''); }}>{slotLabel(slot, timezone)}{slot === selectedSlot && <UiIcon name="check" />}</button>)}</div>}
          </div>
        </div>
        <label className="h30-timezone" htmlFor="booking-timezone"><span>Zona horaria</span><select id="booking-timezone" value={timezone} onChange={event => changeTimezone(event.target.value)}>{zones.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <div className="h30-booking-bottom"><p aria-live="polite">{selectedStillAvailable ? <><strong>{slotLabel(selectedSlot, timezone)}</strong><br />{longDay(dateKey(selectedSlot, timezone))}</> : <>Selecciona una fecha<br />y un horario.</>}</p><button type="button" className="h30-button h30-primary" disabled={!selectedStillAvailable || !available} onClick={() => setStep(2)}>Continuar <UiIcon name="right" /></button></div>
      </div>}
      {step === 2 && <div className="h30-step-panel"><button type="button" className="h30-back" onClick={() => { setStep(1); reload(); }}><UiIcon name="left" />Cambiar horario</button><div className="h30-panel-heading"><h3 ref={heading} tabIndex={-1}>Tus datos</h3></div><p className="h30-selection-summary">{fullSlot(selectedSlot, timezone)}<span>{zones.find(zone => zone[0] === timezone)?.[1]} · 30 minutos</span></p>
        <form className="h30-form" onSubmit={submitDetails}>
          <p className="h30-field-note">Todos los campos son obligatorios, salvo tu idea.</p>
          <div className="h30-field"><label htmlFor="booking-name">Tu nombre</label><input id="booking-name" name="name" autoComplete="name" required maxLength={100} minLength={2} value={details.name} onChange={event => updateDetails('name', event.target.value)} placeholder="¿Cómo te llamas?" /></div>
          <div className="h30-field"><label htmlFor="booking-email">Correo electrónico</label><input id="booking-email" name="email" type="email" autoComplete="email" required maxLength={254} value={details.email} onChange={event => updateDetails('email', event.target.value)} placeholder="tu@correo.com" /><p>Enviaremos aquí la confirmación y los recordatorios.</p></div>
          <div className="h30-field"><label htmlFor="booking-phone">Celular con código de país</label><input id="booking-phone" name="phone" type="tel" autoComplete="tel" required maxLength={25} pattern="\+[0-9\s\(\)\.\-]{8,24}" value={details.phone} onChange={event => updateDetails('phone', event.target.value)} placeholder="+1 305 555 0123" aria-describedby="booking-phone-help" /><p id="booking-phone-help">Incluye + y el código de país. Ejemplo: +1 para Estados Unidos.</p></div>
          <fieldset className="h30-call-channel"><legend>¿Cómo prefieres hablar?</legend><div><label><input type="radio" name="call-channel" value="whatsapp" checked={details.callChannel === 'whatsapp'} onChange={() => updateDetails('callChannel', 'whatsapp')} />WhatsApp</label><label><input type="radio" name="call-channel" value="phone" checked={details.callChannel === 'phone'} onChange={() => updateDetails('callChannel', 'phone')} />Llamada telefónica</label></div><p>Yankiel te llamará al celular que indicaste.</p></fieldset>
          <div className="h30-field"><label htmlFor="booking-topic">¿De qué hablamos?</label><select id="booking-topic" name="topic" required value={details.topic} onChange={event => updateDetails('topic', event.target.value)}><option value="">Selecciona un tema</option>{topics.map(topic => <option key={topic}>{topic}</option>)}</select></div>
          <div className="h30-field"><label htmlFor="booking-notes">Tu idea en pocas palabras <span>opcional</span></label><textarea id="booking-notes" name="notes" rows={3} maxLength={1200} value={details.notes} onChange={event => updateDetails('notes', event.target.value)} placeholder="Tengo una idea para una aplicación y quiero saber por dónde empezar…" /></div>
          <button className="h30-button h30-primary h30-full" type="submit">Revisar mi consulta <UiIcon name="right" /></button><p className="h30-privacy-note">Usaremos tus datos para gestionar esta consulta. <Link href="/privacidad" target="_blank" rel="noopener noreferrer">Ver privacidad (nueva pestaña)</Link>.</p>
        </form>
      </div>}
      {step === 3 && <div className="h30-step-panel"><button type="button" className="h30-back" disabled={checkout === 'submitting'} onClick={() => setStep(2)}><UiIcon name="left" />Editar mis datos</button><div className="h30-panel-heading"><h3 ref={heading} tabIndex={-1}>Revisa tu reserva</h3></div><p className="h30-review-intro">Revisa los detalles antes de pagar.</p><dl className="h30-review-list"><div><dt>Cuándo</dt><dd>{fullSlot(selectedSlot, timezone)}<small>{zones.find(zone => zone[0] === timezone)?.[1]}</small></dd></div><div><dt>Cómo</dt><dd>{meetingLabel(details.callChannel)} · 30 minutos</dd></div><div><dt>Nombre</dt><dd>{details.name}</dd></div><div><dt>Correo</dt><dd>{details.email}</dd></div><div><dt>Celular</dt><dd>{details.phone}</dd></div><div><dt>Tema</dt><dd>{details.topic}</dd></div>{details.notes && <div><dt>Tu idea</dt><dd>{details.notes}</dd></div>}</dl><button className="h30-back" type="button" disabled={checkout === 'submitting'} onClick={() => { setStep(1); reload(); }}>Cambiar fecha u hora</button><div className="h30-total"><div>Total de tu consulta<span>Una sesión · Pago único · Sin reembolsos</span></div><strong>$49 <span>USD</span></strong></div><form onSubmit={pay}><label className="h30-policy"><input type="checkbox" required checked={policy} disabled={checkout === 'submitting'} onChange={event => setPolicy(event.target.checked)} /><span>Acepto los <Link href="/terminos" target="_blank" rel="noopener noreferrer">términos</Link> y la <Link href="/privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</Link> (se abren en otra pestaña). Entiendo que la consulta cuesta <strong>49 USD, dura 30 minutos y no tiene reembolsos.</strong></span></label><button className="h30-button h30-primary h30-full" type="submit" disabled={checkout === 'submitting'}>{checkout === 'submitting' ? 'Abriendo el pago…' : 'Pagar 49 USD y reservar'}<UiIcon name="right" /></button><p className="h30-privacy-note" aria-live="polite">{checkout === 'submitting' ? 'Estamos preparando tu pago en Stripe.' : 'Continuarás a Stripe. La reserva se confirma después de verificar el pago.'}</p></form></div>}
    </div><footer className="h30-booking-footer">49 USD · Pago único · Sin reembolsos</footer>
  </section>;
}
