"use client";
import UiIcon from '@/components/ui-icon';

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

type Tab = "reservas" | "disponibilidad" | "comunicaciones" | "actividad";
type Meeting = "pending" | "phone" | "whatsapp" | "google_meet" | "zoom";
type BookingStatus = "confirmed" | "completed" | "no_show" | "cancelled";
type WeeklyHour = { day: number; enabled: boolean; start: string; end: string };
type Settings = {
  hostName: string; timezone: string; weeklyHours: WeeklyHour[]; meetingType: Meeting;
  meetingUrl: string; adminEmail: string; bookingEnabled: boolean;
  minNoticeHours: number; horizonDays: number; bufferMinutes: number;
};
type Booking = {
  id: string; startAt: string; endAt: string; status: string; paymentStatus: string;
  customerName: string; email: string; phone: string; topic: string; notes: string;
  adminNotes: string; timezone: string; meetingType: Meeting; meetingUrl: string;
  priceCents: number; currency: string; createdAt: string; stripeSessionId?: string | null;
};
type Notification = {
  id: string; bookingId: string; recipient: string; kind: string; status: string;
  attempts: number; dueAt: string | null; sentAt: string | null; lastError: string | null;
};
type Block = { id: string; startAt: string; endAt: string; reason: string };
type Audit = { id: string; action: string; details: unknown; createdAt: string };
type AdminData = {
  settings: Settings; bookings: Booking[]; notifications: Notification[];
  blocks: Block[]; audit: Audit[]; health: Record<string, boolean | string>;
};

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const statusNames: Record<string, string> = {
  held: "Pendiente de pago", payment_review: "Revisión de pago", review: "En revisión", sending: "Enviando", confirmed: "Confirmada", completed: "Realizada", no_show: "No asistió", cancelled: "Cancelada",
  pending: "Pendiente", pending_payment: "Pendiente de pago", paid: "Pagado", unpaid: "Sin pagar",
  expired: "Vencida", refunded: "Reembolsado", failed: "Fallido", sent: "Enviado",
  queued: "En cola", processing: "Procesando", scheduled: "Programado", skipped: "Omitido",
};
const meetingNames: Record<Meeting, string> = {
  pending: "Por configurar", phone: "Teléfono", whatsapp: "WhatsApp", google_meet: "Google Meet", zoom: "Zoom",
};
const kindNames: Record<string, string> = {
  confirmation: "Confirmación", booking_confirmation: "Confirmación", admin_confirmation: "Aviso administrativo",
  reminder_24h: "Recordatorio · 24 horas", reminder_1h: "Recordatorio · 1 hora",
  reminder: "Recordatorio", admin_booking: "Nueva reserva", cancellation: "Cancelación",
};
const actionNames: Record<string, string> = {
  booking_paid: "Pago recibido y cita confirmada", booking_admin_updated: "Reserva actualizada", calendar_block_created: "Período bloqueado", calendar_block_removed: "Bloqueo eliminado", settings_updated: "Configuración actualizada", booking_updated: "Reserva actualizada",
  payment_confirmed: "Pago confirmado", booking_confirmed: "Reserva confirmada",
  block_created: "Bloqueo añadido", block_deleted: "Bloqueo eliminado", admin_login: "Acceso administrativo",
  cron_completed: "Procesamiento de recordatorios", payment_requires_review: "Pago pendiente de revisión", notification_retry: "Reintento de correo", notification_retried: "Reintento de correo", checkout_created: "Proceso de pago iniciado",
};

class SessionExpired extends Error {}
async function api<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method, credentials: "same-origin", cache: "no-store",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (response.status === 401) throw new SessionExpired("Tu sesión terminó. Vuelve a entrar.");
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "No se pudo completar la operación. Inténtalo de nuevo.");
  return result as T;
}
function dateLabel(value: string | null | undefined, timezone: string, detailed = false) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("es-US", {
    timeZone: timezone, day: "numeric", month: "short", ...(detailed ? { year: "numeric" } : {}),
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(value));
}
function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("es-US", { style: "currency", currency }).format(cents / 100);
}
function Badge({ value }: { value: string }) {
  return <span className={`ad-badge ad-badge-${value.replace(/[^a-z_]/g, "")}`}>{statusNames[value] || value}</span>;
}
function Empty({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="ad-empty"><span aria-hidden="true">—</span><h3>{title}</h3><p>{children}</p></div>;
}

// Convert a wall-clock time into the agenda timezone and reject nonexistent DST times.
function zonedIso(value: string, timezone: string) {
  const desired = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(desired)) throw new Error("Selecciona una fecha y hora válidas.");
  const format = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  let candidate = desired;
  for (let i = 0; i < 3; i++) {
    const wall = Date.parse(format.format(new Date(candidate)).replace(" ", "T") + "Z");
    candidate += desired - wall;
  }
  if (format.format(new Date(candidate)).slice(0, 16).replace(" ", "T") !== value) {
    throw new Error("Esa hora no existe por el cambio de horario. Selecciona otra hora.");
  }
  return new Date(candidate).toISOString();
}

export default function AdminDashboard() {
  const [session, setSession] = useState<"loading" | "login" | "ready">("loading");
  const [data, setData] = useState<AdminData | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tab, setTab] = useState<Tab>("reservas");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editStatus, setEditStatus] = useState<BookingStatus>("confirmed");
  const [adminNotes, setAdminNotes] = useState("");
  const [block, setBlock] = useState({ startAt: "", endAt: "", reason: "" });
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);

  const load = useCallback(async (resetSettings = true) => {
    const result = await api<AdminData>("/api/admin/data");
    if (!mounted.current) return;
    setData({ ...result, blocks: result.blocks || [] });
    if (resetSettings) setSettings(result.settings);
    setSession("ready");
  }, []);
  useEffect(() => {
    mounted.current = true;
    load().catch((reason: unknown) => {
      if (!mounted.current) return;
      setSession("login");
      if (!(reason instanceof SessionExpired)) setError("No pudimos conectar con el panel. Puedes volver a intentarlo al entrar.");
    });
    return () => { mounted.current = false; };
  }, [load]);
  useEffect(() => {
    if (selected && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);

  async function run(action: () => Promise<void>, success?: string) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await action(); if (success) setNotice(success); }
    catch (reason) {
      if (reason instanceof SessionExpired) { setSelected(null); setSession("login"); setPassword(""); }
      setError(reason instanceof Error ? reason.message : "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
    } finally { setBusy(false); }
  }
  async function login(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      try { await api("/api/admin/login", "POST", { password }); }
      catch (reason) { if (reason instanceof SessionExpired) throw new Error("La contraseña no es correcta o el acceso no está disponible."); throw reason; }
      setPassword(""); await load();
    });
  }
  function openBooking(booking: Booking) {
    setSelected(booking);
    setEditStatus(["confirmed", "completed", "no_show", "cancelled"].includes(booking.status) ? booking.status as BookingStatus : "cancelled");
    setAdminNotes(booking.adminNotes || "");
    setError(""); setNotice("");
  }
  async function saveBooking(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    if (editStatus === "cancelled" && selected.status !== "cancelled" && !window.confirm("¿Cancelar esta cita? Se liberará el horario. Esta acción no reembolsa el pago.")) return;
    await run(async () => {
      await api(`/api/admin/bookings/${encodeURIComponent(selected.id)}`, "PATCH", { status: editStatus, adminNotes });
      await load(false); setSelected(null);
    }, "Reserva actualizada.");
  }
  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    await run(async () => {
      if (settings.bookingEnabled && (!settings.adminEmail.trim() || settings.meetingType === "pending")) throw new Error("Configura el canal de llamada y el correo administrativo antes de abrir las reservas.");
      if (settings.bookingEnabled && ["google_meet", "zoom"].includes(settings.meetingType) && !settings.meetingUrl.trim()) throw new Error("Añade el enlace de la videollamada antes de abrir las reservas.");
      for (const day of settings.weeklyHours) if (day.enabled && day.start >= day.end) throw new Error(`Revisa el horario del ${dayNames[day.day].toLowerCase()}: la hora de cierre debe ser posterior a la apertura.`);
      await api("/api/admin/settings", "PATCH", { settings }); await load();
    }, "Disponibilidad guardada.");
  }
  async function addBlock(event: FormEvent) {
    event.preventDefault();
    await run(async () => {
      const startAt = zonedIso(block.startAt, timezone); const endAt = zonedIso(block.endAt, timezone);
      if (endAt <= startAt) throw new Error("El final del bloqueo debe ser posterior al inicio.");
      await api("/api/admin/blocks", "POST", { ...block, startAt, endAt }); await load(false);
      setBlock({ startAt: "", endAt: "", reason: "" });
    }, "Tiempo bloqueado. Ese período ya no estará disponible para reservar.");
  }
  const timezone = data?.settings.timezone || "America/New_York";
  const bookings = data?.bookings || [];
  const paid = bookings.filter((booking) => booking.paymentStatus === "paid");
  const upcoming = bookings.filter((booking) => booking.status === "confirmed" && new Date(booking.startAt).getTime() >= Date.now());
  const failedNotifications = data?.notifications.filter((item) => item.status === "failed") || [];
  const visibleBookings = bookings.filter((booking) => {
    const matches = `${booking.customerName} ${booking.email} ${booking.phone} ${booking.topic}`.toLowerCase().includes(search.toLowerCase());
    const state = filter === "all" || (filter === "upcoming" ? booking.status === "confirmed" && new Date(booking.startAt).getTime() >= Date.now() : filter === "pending" ? booking.paymentStatus !== "paid" : booking.status === filter);
    return matches && state;
  }).sort((a, b) => filter === "upcoming" ? Date.parse(a.startAt) - Date.parse(b.startAt) : Date.parse(b.startAt) - Date.parse(a.startAt));
  function field<K extends keyof Settings>(name: K, value: Settings[K]) { setSettings((current) => current ? { ...current, [name]: value } : null); }

  if (session === "loading") return <main className="ad-root ad-entry"><div className="ad-entry-panel" role="status"><a className="ad-brand" href="/">hablemos<span>30min</span></a><h1>Abriendo tu agenda…</h1><p>Comprobando la sesión administrativa.</p></div></main>;
  if (session === "login") return <main className="ad-root ad-entry"><form className="ad-entry-panel" onSubmit={login}><a className="ad-brand" href="/">hablemos<span>30min</span></a><p className="ad-eyebrow">Tu espacio de trabajo</p><h1>Todo listo para organizar tu agenda.</h1><p>Entra para revisar reservas, horarios y mensajes.</p><label className="ad-field">Contraseña administrativa<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="ad-feedback ad-error" role="alert">{error}</p>}<button className="ad-primary" disabled={busy}>{busy ? "Entrando…" : "Entrar al panel"}<UiIcon name="right" /></button><a className="ad-back-link" href="/">Volver a Hablemos30min</a></form></main>;
  if (!data || !settings) return null;

  return <main className="ad-root">
    <header className="ad-topbar"><a className="ad-brand" href="/">hablemos<span>30min</span></a><div className="ad-topbar-actions"><a href="/" target="_blank" rel="noreferrer">Ver página <UiIcon name="right" /></a><button className="ad-text-button" disabled={busy} onClick={() => run(async () => { await api("/api/admin/logout", "POST"); setSession("login"); setData(null); setSettings(null); setPassword(""); })}>Cerrar sesión</button></div></header>
    <div className="ad-shell">
      <section className="ad-heading"><div><p className="ad-eyebrow">Administración · {data.settings.hostName}</p><h1>Tu agenda, en orden.</h1><p>{timezone === "America/New_York" ? "Hora de Miami" : timezone} · Consultas de 30 minutos · 49 USD</p></div><div className={`ad-agenda-state ${data.settings.bookingEnabled ? "is-open" : ""}`}><span aria-hidden="true" /><strong>{data.settings.bookingEnabled ? "Reservas abiertas" : "Reservas pausadas"}</strong><button className="ad-text-button" onClick={() => setTab("disponibilidad")}>Configurar</button></div></section>
      <section className="ad-metrics" aria-label="Resumen de la agenda"><div><span>Próximas citas confirmadas</span><strong>{upcoming.length}</strong></div><div><span>Reservas con pago recibido</span><strong>{paid.length}</strong></div><div><span>Importe de pagos registrados</span><strong>{money(paid.reduce((sum, booking) => sum + booking.priceCents, 0))}</strong><small>Antes de comisiones de Stripe</small></div><div><span>Correos que requieren atención</span><strong>{failedNotifications.length}</strong>{failedNotifications.length > 0 && <button className="ad-text-button" onClick={() => setTab("comunicaciones")}>Revisar</button>}</div></section>
      <div className="ad-section-nav"><nav aria-label="Secciones del panel">{(["reservas", "disponibilidad", "comunicaciones", "actividad"] as Tab[]).map((name) => <button key={name} className={tab === name ? "is-active" : ""} aria-current={tab === name ? "page" : undefined} onClick={() => { setTab(name); setError(""); setNotice(""); }}>{name[0].toUpperCase() + name.slice(1)}</button>)}</nav><button className="ad-text-button" disabled={busy} onClick={() => run(() => load(tab !== "disponibilidad"), "Datos actualizados.")}>{busy ? "Procesando…" : "Actualizar"}</button></div>
      {!selected && error && <p className="ad-feedback ad-error" role="alert">{error}</p>}{notice && <p className="ad-feedback ad-success" role="status">{notice}</p>}

      {tab === "reservas" && <section className="ad-surface"><div className="ad-section-heading"><div><h2>Reservas</h2><p>El pago verificado confirma la cita. Revisa cada reserva para ver todos sus detalles.</p></div><a className="ad-secondary" href="/api/admin/export">Exportar CSV</a></div><div className="ad-toolbar"><label className="ad-search"><span className="ad-sr-only">Buscar reservas</span><input type="search" placeholder="Buscar nombre, correo, celular o tema" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label className="ad-filter">Mostrar<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="upcoming">Próximas citas</option><option value="all">Todas las reservas</option><option value="pending">Pago sin confirmar</option><option value="completed">Realizadas</option><option value="no_show">No asistió</option><option value="cancelled">Canceladas</option></select></label></div>{visibleBookings.length ? <div className="ad-booking-table"><div className="ad-booking-labels" aria-hidden="true"><span>Persona / tema</span><span>Fecha y hora</span><span>Reserva</span><span>Pago</span><span>Detalle</span></div>{visibleBookings.map((booking) => <article className="ad-booking-row" key={booking.id}><div><h3>{booking.customerName}</h3><p>{booking.topic || "Consulta de 30 minutos"}</p><small>{booking.email}</small></div><div className="ad-row-date"><strong>{dateLabel(booking.startAt, timezone, true)}</strong><small>30 min · {meetingNames[booking.meetingType] || "Por configurar"}</small></div><div><Badge value={booking.status} /></div><div><Badge value={booking.paymentStatus} /><small>{money(booking.priceCents, booking.currency)}</small></div><button className="ad-secondary ad-row-action" onClick={() => openBooking(booking)} aria-label={`Ver reserva de ${booking.customerName}`}>Ver detalle <UiIcon name="right" /></button></article>)}</div> : <Empty title={search || filter !== "upcoming" ? "No hay reservas con estos filtros" : "Tu próxima conversación aparecerá aquí"}>{search || filter !== "upcoming" ? "Prueba otra búsqueda o selecciona todas las reservas." : "Cuando una persona complete su pago, podrás revisar su cita y sus datos de contacto."}</Empty>}</section>}

      {tab === "disponibilidad" && <div className="ad-settings-grid"><form className="ad-surface" onSubmit={saveSettings}><div className="ad-section-heading"><div><h2>Disponibilidad y llamada</h2><p>Los cambios se aplican a nuevas reservas. Las citas existentes conservan sus datos.</p></div></div><div className="ad-form-fields"><div className="ad-form-pair"><label className="ad-field">Nombre del anfitrión<input required maxLength={100} value={settings.hostName} onChange={(event) => field("hostName", event.target.value)} /></label><label className="ad-field">Zona horaria<select value={settings.timezone} onChange={(event) => field("timezone", event.target.value)}>{Array.from(new Set(["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Puerto_Rico", "Europe/Madrid", settings.timezone])).map((zone) => <option key={zone} value={zone}>{zone === "America/New_York" ? "Miami · América/New_York" : zone}</option>)}</select></label></div><div className="ad-form-pair"><label className="ad-field">Canal de llamada<select value={settings.meetingType} onChange={(event) => field("meetingType", event.target.value as Meeting)}>{Object.entries(meetingNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="ad-field">Correo para recibir reservas<input type="email" required={settings.bookingEnabled} maxLength={254} placeholder="tu@correo.com" value={settings.adminEmail} onChange={(event) => field("adminEmail", event.target.value)} /></label></div>{["google_meet", "zoom", "whatsapp"].includes(settings.meetingType) && <label className="ad-field">{settings.meetingType === "whatsapp" ? "Enlace de WhatsApp del anfitrión" : "Enlace de la videollamada"}<input type="url" required={settings.meetingType !== "whatsapp"} value={settings.meetingUrl} placeholder="https://…" onChange={(event) => field("meetingUrl", event.target.value)} /><small>Este enlace se incluirá en la confirmación de las nuevas reservas.</small></label>}<fieldset className="ad-week"><legend>Horario habitual</legend><p>Horas expresadas en {settings.timezone === "America/New_York" ? "hora de Miami" : settings.timezone}.</p>{[1, 2, 3, 4, 5, 6, 0].map((day) => { const hours = settings.weeklyHours.find((item) => item.day === day) || { day, enabled: false, start: "09:00", end: "17:00" }; function changeHour(patch: Partial<WeeklyHour>) { field("weeklyHours", [...settings!.weeklyHours.filter((item) => item.day !== day), { ...hours, ...patch }].sort((a, b) => a.day - b.day)); } return <div className="ad-week-row" key={day}><label className="ad-check"><input type="checkbox" checked={hours.enabled} onChange={(event) => changeHour({ enabled: event.target.checked })} />{dayNames[day]}</label><div className="ad-hour-inputs"><label><span className="ad-sr-only">Apertura del {dayNames[day]}</span><input type="time" required disabled={!hours.enabled} value={hours.start} onChange={(event) => changeHour({ start: event.target.value })} /></label><span>—</span><label><span className="ad-sr-only">Cierre del {dayNames[day]}</span><input type="time" required disabled={!hours.enabled} value={hours.end} onChange={(event) => changeHour({ end: event.target.value })} /></label></div></div>; })}</fieldset><div className="ad-limits"><label className="ad-field">Anticipación mínima (horas)<input type="number" min={1} max={168} required value={settings.minNoticeHours} onChange={(event) => field("minNoticeHours", Number(event.target.value))} /></label><label className="ad-field">Reservas hasta (días)<input type="number" min={1} max={180} required value={settings.horizonDays} onChange={(event) => field("horizonDays", Number(event.target.value))} /></label><label className="ad-field">Pausa entre citas (minutos)<input type="number" min={0} max={120} required value={settings.bufferMinutes} onChange={(event) => field("bufferMinutes", Number(event.target.value))} /></label></div><div className="ad-booking-switch"><label className="ad-check"><input type="checkbox" checked={settings.bookingEnabled} onChange={(event) => field("bookingEnabled", event.target.checked)} /><strong>Abrir reservas al público</strong></label><p>Actívalo cuando el canal de llamada y el correo administrativo estén configurados.</p></div><button className="ad-primary" disabled={busy}>{busy ? "Guardando…" : "Guardar disponibilidad"}</button></div></form><div className="ad-settings-side"><section className="ad-surface"><div className="ad-section-heading"><div><h2>Bloquear un período</h2><p>Vacaciones, descanso o un compromiso puntual. Hora de {timezone === "America/New_York" ? "Miami" : timezone}.</p></div></div><form className="ad-form-fields" onSubmit={addBlock}><label className="ad-field">Desde<input type="datetime-local" required value={block.startAt} onChange={(event) => setBlock({ ...block, startAt: event.target.value })} /></label><label className="ad-field">Hasta<input type="datetime-local" required value={block.endAt} onChange={(event) => setBlock({ ...block, endAt: event.target.value })} /></label><label className="ad-field">Motivo<input required maxLength={300} value={block.reason} onChange={(event) => setBlock({ ...block, reason: event.target.value })} placeholder="Ej. Compromiso personal" /></label><button className="ad-secondary" disabled={busy}>Añadir bloqueo</button><p className="ad-help">Bloquear un período no cancela citas existentes. Revisa tus reservas antes de hacerlo.</p></form></section><section className="ad-surface"><div className="ad-section-heading"><h2>Períodos bloqueados</h2></div>{data.blocks.length ? <ul className="ad-block-list">{data.blocks.map((item) => <li key={item.id}><div><strong>{item.reason}</strong><p>{dateLabel(item.startAt, timezone, true)}<br />a {dateLabel(item.endAt, timezone, true)}</p></div><button className="ad-text-button ad-danger-text" disabled={busy} onClick={() => { if (window.confirm("¿Eliminar este bloqueo? El horario volverá a estar disponible si pertenece a tu jornada.")) run(async () => { await api(`/api/admin/blocks/${encodeURIComponent(item.id)}`, "DELETE"); await load(false); }, "Bloqueo eliminado."); }}>Eliminar</button></li>)}</ul> : <Empty title="Sin períodos bloqueados">Tu horario habitual determina la disponibilidad.</Empty>}</section></div></div>}

      {tab === "comunicaciones" && <section className="ad-surface"><div className="ad-section-heading"><div><h2>Comunicaciones</h2><p>Confirmaciones y recordatorios por correo. Un estado enviado registra la aceptación del servidor de correo.</p></div></div><div className="ad-service-status" aria-label="Estado de servicios">{[["database", "Base de datos"], ["stripe", "Stripe"], ["email", "Correo"], ["cron", "Recordatorios"]].map(([key, label]) => <div key={key}><span>{label}</span><strong>{data.health[key] === true ? "Configurado" : data.health[key] === false ? "Pendiente" : data.health[key] || "Sin información"}</strong></div>)}</div>{data.notifications.length ? <ul className="ad-notification-list">{data.notifications.map((item) => <li key={item.id}><div><strong>{kindNames[item.kind] || "Notificación de reserva"}</strong><p>{item.recipient}</p><small>{item.sentAt ? `Enviado: ${dateLabel(item.sentAt, timezone, true)}` : item.dueAt ? `Próximo intento: ${dateLabel(item.dueAt, timezone, true)}` : "Sin fecha de envío"} · {item.attempts} {item.attempts === 1 ? "intento" : "intentos"}</small>{item.lastError && <p className="ad-inline-error">Último error: {item.lastError}</p>}</div><div className="ad-notification-action"><Badge value={item.status} />{item.status === "failed" && <button className="ad-secondary" disabled={busy} onClick={() => run(async () => { await api("/api/admin/notifications/retry", "POST", { id: item.id }); await load(false); }, "Reintento procesado. Revisa el estado actualizado del correo.")}>Reintentar</button>}</div></li>)}</ul> : <Empty title="Todavía no hay comunicaciones">Aquí aparecerán los correos de confirmación y los recordatorios de cada cita.</Empty>}</section>}

      {tab === "actividad" && <section className="ad-surface"><div className="ad-section-heading"><div><h2>Registro de actividad</h2><p>Historial de cambios y eventos del sistema.</p></div></div>{data.audit.length ? <ol className="ad-audit-list">{data.audit.map((item) => <li key={item.id}><time dateTime={item.createdAt}>{dateLabel(item.createdAt, timezone, true)}</time><div><strong>{actionNames[item.action] || item.action.replaceAll("_", " ")}</strong>{item.details != null && <details><summary>Ver detalles del evento</summary><pre>{typeof item.details === "string" ? item.details : JSON.stringify(item.details, null, 2)}</pre></details>}</div></li>)}</ol> : <Empty title="El historial comienza aquí">Los cambios de configuración y los eventos de reserva quedarán registrados.</Empty>}</section>}
      <footer className="ad-footer"><span>Hablemos30min · Panel privado</span><span>Pago único de 49 USD · Sin reembolsos</span></footer>
    </div>
    <dialog className="ad-dialog" ref={dialog} onCancel={(event) => { if (busy) event.preventDefault(); }} onClose={() => setSelected(null)} aria-labelledby="booking-title">{selected && <><div className="ad-dialog-top"><div><p className="ad-eyebrow">Detalle de la reserva</p><h2 id="booking-title">{selected.customerName}</h2></div><button className="ad-close" aria-label="Cerrar detalle" disabled={busy} onClick={() => setSelected(null)}>×</button></div><div className="ad-dialog-content"><div className="ad-detail-date"><strong>{dateLabel(selected.startAt, timezone, true)}</strong><p>30 minutos · {timezone === "America/New_York" ? "Hora de Miami" : timezone}</p><div><Badge value={selected.status} /><Badge value={selected.paymentStatus} /></div></div><dl className="ad-details"><div><dt>Correo</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd></div><div><dt>Celular</dt><dd><a href={`tel:${selected.phone.replace(/[^+\d]/g, "")}`}>{selected.phone}</a>{selected.phone && <a className="ad-contact-link" href={`https://wa.me/${selected.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">Abrir WhatsApp</a>}</dd></div><div><dt>Tema</dt><dd>{selected.topic || "Consulta de 30 minutos"}</dd></div><div><dt>Mensaje del cliente</dt><dd className="ad-preserve-lines">{selected.notes || "Sin mensaje adicional."}</dd></div><div><dt>Canal de llamada</dt><dd>{meetingNames[selected.meetingType]}{selected.meetingUrl && /^https:\/\//i.test(selected.meetingUrl) && <a className="ad-contact-link" href={selected.meetingUrl} target="_blank" rel="noreferrer">Abrir enlace</a>}</dd></div><div><dt>Zona del cliente</dt><dd>{selected.timezone}</dd></div><div><dt>Importe</dt><dd>{money(selected.priceCents, selected.currency)} · Pago único</dd></div><div><dt>Reserva creada</dt><dd>{dateLabel(selected.createdAt, timezone, true)}</dd></div><div><dt>Referencia de reserva</dt><dd><code>{selected.id}</code></dd></div>{selected.stripeSessionId && <div><dt>Sesión de Stripe</dt><dd><code>{selected.stripeSessionId}</code></dd></div>}</dl><form className="ad-detail-form" onSubmit={saveBooking}>{selected.paymentStatus === "paid" && <label className="ad-field">Estado de la cita<select value={editStatus} onChange={(event) => setEditStatus(event.target.value as BookingStatus)}><option value="confirmed" disabled={selected.paymentStatus !== "paid"}>Confirmada</option><option value="completed" disabled={selected.paymentStatus !== "paid"}>Realizada</option><option value="no_show" disabled={selected.paymentStatus !== "paid"}>No asistió</option><option value="cancelled">Cancelada</option></select></label>}{selected.paymentStatus !== "paid" && <p className="ad-help">Esta reserva no tiene un pago confirmado. La edición estará disponible cuando se verifique el pago en el servidor.</p>}<label className="ad-field">Notas internas<textarea readOnly={selected.paymentStatus !== "paid"} rows={4} maxLength={5000} value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} placeholder="Información para tu seguimiento. No se envía al cliente." /></label><p className="ad-help">Cambiar o cancelar la cita no genera un reembolso automático.</p>{error && <p className="ad-feedback ad-error" role="alert">{error}</p>}<div className="ad-dialog-actions"><button type="button" className="ad-secondary" disabled={busy} onClick={() => setSelected(null)}>Cerrar</button><button className="ad-primary" disabled={busy || selected.paymentStatus !== "paid"}>{busy ? "Guardando…" : "Guardar cambios"}</button></div></form></div></>}</dialog>
  </main>;
}
