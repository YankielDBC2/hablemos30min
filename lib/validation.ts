import { z } from "zod";
z.config(z.locales.es());

export const PRICE_CENTS = 4900;
export const DURATION_MINUTES = 30;
export const timezoneSchema = z.string().max(80).refine((zone) => {
  try { new Intl.DateTimeFormat("en", { timeZone: zone }); return true; } catch { return false; }
}, "Zona horaria inválida");
export const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().trim().toLowerCase().max(254),
  phone: z.string().trim().max(30).regex(/^\+[\d\s().-]+$/, "Incluye el código de país, por ejemplo +1 305 555 0100").transform(value=>value.replace(/[\s().-]/g,'')).pipe(z.string().regex(/^\+[1-9]\d{7,14}$/, "Revisa tu celular y el código de país")),
  topic: z.string().trim().min(3).max(250),
  notes: z.string().trim().max(2000).default(""),
  startAt: z.iso.datetime({ offset: true }),
  timezone: timezoneSchema,
  callChannel: z.enum(["whatsapp","phone"]).default("whatsapp"),
  acceptedPolicy: z.literal(true),
  idempotencyKey: z.uuid(),
}).strict();
const hour = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const settingsSchema = z.object({
  hostName: z.string().trim().min(2).max(120),
  timezone: timezoneSchema,
  bookingEnabled: z.boolean(),
  meetingType: z.enum(["pending", "phone", "whatsapp", "google_meet", "zoom"]),
  meetingUrl: z.union([z.literal(""), z.url().max(500)]).default(""),
  adminEmail: z.union([z.literal(""), z.email().max(254)]),
  minNoticeHours: z.number().int().min(1).max(168),
  horizonDays: z.number().int().min(1).max(180),
  bufferMinutes: z.number().int().min(0).max(120),
  weeklyHours: z.array(z.object({ day: z.number().int().min(0).max(6), enabled: z.boolean(), start: hour, end: hour }).strict()).length(7),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.weeklyHours.map((v) => v.day)).size !== 7) ctx.addIssue({code:"custom",message:"Configura cada día una sola vez",path:["weeklyHours"]});
  for (const entry of value.weeklyHours) if (entry.enabled && entry.start >= entry.end) ctx.addIssue({code:"custom",message:"La hora final debe ser posterior",path:["weeklyHours"]});
  if (value.bookingEnabled && (value.meetingType === "pending" || !value.adminEmail)) ctx.addIssue({code:"custom",message:"Indica el canal de llamada y correo administrativo antes de abrir reservas",path:["bookingEnabled"]});
  if (value.bookingEnabled && ["google_meet", "zoom"].includes(value.meetingType) && !value.meetingUrl) ctx.addIssue({code:"custom",message:"Añade el enlace de la reunión",path:["meetingUrl"]});
  if (value.meetingUrl && !value.meetingUrl.startsWith("https://")) ctx.addIssue({code:"custom",message:"El enlace debe utilizar HTTPS",path:["meetingUrl"]});
});
export const adminBookingSchema = z.object({status:z.enum(["confirmed","completed","no_show","cancelled"]),adminNotes:z.string().trim().max(5000)}).strict();
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AppSettings = z.infer<typeof settingsSchema>;
export const DEFAULT_SETTINGS: AppSettings = {
  hostName:"Yankiel D. Beltrán Cabrera", timezone:"America/New_York", bookingEnabled:true, meetingType:"whatsapp", meetingUrl:"https://wa.me/19797301283", adminEmail:"business@hablemos30min.online", minNoticeHours:2, horizonDays:60, bufferMinutes:0,
  weeklyHours: Array.from({length:7},(_,day)=>({day,enabled:day!==0,start:day===6?"11:00":"09:00",end:day===6?"16:00":"20:00"})),
};
