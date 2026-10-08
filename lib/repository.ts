import { randomUUID } from "node:crypto";
import { query } from "./database";
import { AppError } from "./errors";
import { DEFAULT_SETTINGS, settingsSchema, type AppSettings, type CheckoutInput } from "./validation";

export type BookingStatus="held"|"confirmed"|"payment_review"|"completed"|"no_show"|"cancelled"|"expired";
export interface Booking {
 id:string; idempotencyKey:string; payloadHash:string; customerName:string; email:string; phone:string; topic:string; notes:string; adminNotes:string;
 startAt:string; endAt:string; blockedUntil:string; timezone:string; meetingType:string; meetingUrl:string; hostName:string; adminEmail:string;
 status:BookingStatus; paymentStatus:"unpaid"|"paid"|"review"; priceCents:number; currency:string; stripeSessionId:string|null; holdExpiresAt:string; createdAt:string; paidAt:string|null;
}
const iso=(value:unknown)=>value instanceof Date?value.toISOString():new Date(String(value)).toISOString();
function mapBooking(row:Record<string,unknown>):Booking {
 return {id:String(row.id),idempotencyKey:String(row.idempotency_key),payloadHash:String(row.payload_hash),customerName:String(row.customer_name),email:String(row.email),phone:String(row.phone),topic:String(row.topic),notes:String(row.notes),adminNotes:String(row.admin_notes),startAt:iso(row.start_at),endAt:iso(row.end_at),blockedUntil:iso(row.blocked_until),timezone:String(row.timezone),meetingType:String(row.meeting_type),meetingUrl:String(row.meeting_url),hostName:String(row.host_name),adminEmail:String(row.admin_email),status:row.status as BookingStatus,paymentStatus:row.payment_status as Booking["paymentStatus"],priceCents:Number(row.price_cents),currency:String(row.currency),stripeSessionId:row.stripe_session_id?String(row.stripe_session_id):null,holdExpiresAt:iso(row.hold_expires_at),createdAt:iso(row.created_at),paidAt:row.paid_at?iso(row.paid_at):null};
}
export async function getSettings():Promise<AppSettings> {
 if(!process.env.DATABASE_URL) return structuredClone(DEFAULT_SETTINGS);
 const [row]=await query("SELECT data FROM app_settings WHERE id=true");
 return row?settingsSchema.parse(row.data):structuredClone(DEFAULT_SETTINGS);
}
export async function saveSettings(data:unknown):Promise<AppSettings> {
 const settings=settingsSchema.parse(data);
 await query("INSERT INTO app_settings (id,data) VALUES(true,$1::jsonb) ON CONFLICT(id) DO UPDATE SET data=EXCLUDED.data,updated_at=now()",[JSON.stringify(settings)]);
 await addAudit("settings_updated",{bookingEnabled:settings.bookingEnabled,meetingType:settings.meetingType});
 return settings;
}
export async function listBookings():Promise<Booking[]> { return (await query("SELECT * FROM bookings WHERE kind='booking' ORDER BY start_at DESC LIMIT 1000")).map(mapBooking); }
export async function getBookingById(id:string):Promise<Booking|null> { const [row]=await query("SELECT * FROM bookings WHERE id=$1",[id]);return row?mapBooking(row):null; }
export async function findByIdempotency(key:string):Promise<Booking|null> {const [row]=await query("SELECT * FROM bookings WHERE idempotency_key=$1",[key]);return row?mapBooking(row):null;}
export async function findBySession(sessionId:string):Promise<Booking|null> {const [row]=await query("SELECT * FROM bookings WHERE stripe_session_id=$1",[sessionId]);return row?mapBooking(row):null;}
export async function createHold(input:CheckoutInput,payloadHash:string,settings:AppSettings,holdExpiresAt:Date):Promise<Booking> {
 const start=new Date(input.startAt),end=new Date(start.getTime()+1800000),blocked=new Date(end.getTime()+settings.bufferMinutes*60000);
 const meetingType=["phone","whatsapp"].includes(settings.meetingType)?input.callChannel:settings.meetingType;
 const meetingUrl=meetingType==="phone"?"":settings.meetingUrl;
 const [row]=await query(`INSERT INTO bookings (id,idempotency_key,payload_hash,customer_name,email,phone,topic,notes,start_at,end_at,blocked_until,timezone,meeting_type,meeting_url,host_name,admin_email,hold_expires_at)
 SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17 FROM app_settings WHERE id=true AND (data->>'bookingEnabled')::boolean=true AND data=$18::jsonb
 ON CONFLICT(idempotency_key) DO UPDATE SET idempotency_key=EXCLUDED.idempotency_key RETURNING *`,[randomUUID(),input.idempotencyKey,payloadHash,input.name,input.email,input.phone,input.topic,input.notes,start.toISOString(),end.toISOString(),blocked.toISOString(),input.timezone,meetingType,meetingUrl,settings.hostName,settings.adminEmail,holdExpiresAt.toISOString(),JSON.stringify(settings)]);
 if(!row) throw new AppError("La disponibilidad cambió. Actualiza el calendario y vuelve a intentarlo.",409,"SCHEDULE_CHANGED");
 return mapBooking(row);
}
export async function attachSession(id:string,sessionId:string,expires:number):Promise<void> {
 await query("UPDATE bookings SET stripe_session_id=$2,hold_expires_at=to_timestamp($3),updated_at=now() WHERE id=$1 AND (stripe_session_id IS NULL OR stripe_session_id=$2)",[id,sessionId,expires]);
}
export async function listExpiredHolds():Promise<Booking[]> {return (await query("SELECT * FROM bookings WHERE kind='booking' AND status='held' AND hold_expires_at<now() ORDER BY hold_expires_at LIMIT 100")).map(mapBooking);}
export async function expireVerifiedHold(id:string):Promise<void> {await query("UPDATE bookings SET status='expired',updated_at=now() WHERE id=$1 AND status='held' AND payment_status='unpaid' AND hold_expires_at<now()",[id]);}
export async function markPaymentReview(id:string):Promise<void> {await query("UPDATE bookings SET status='payment_review',payment_status='review',updated_at=now() WHERE id=$1 AND status='held'",[id]);await addAudit("payment_requires_review",{bookingId:id});}
export async function confirmPaid(id:string,sessionId:string):Promise<Booking> {
 // Confirmation and all email jobs commit in one statement, including webhook retries.
 const rows=await query(`WITH paid AS (
 UPDATE bookings SET status='confirmed',payment_status='paid',paid_at=COALESCE(paid_at,now()),updated_at=now(),stripe_session_id=$2
 WHERE id=$1 AND status='held' AND payment_status='unpaid' AND (stripe_session_id IS NULL OR stripe_session_id=$2) RETURNING *
 ), jobs AS (
 INSERT INTO notifications(id,booking_id,kind,recipient,due_at)
 SELECT gen_random_uuid(),paid.id,j.kind,j.recipient,j.due_at FROM paid CROSS JOIN LATERAL (VALUES
 ('confirmation',paid.email,now()),('admin_confirmation',paid.admin_email,now()),
 ('reminder_24h',paid.email,paid.start_at-interval '24 hours'),('reminder_1h',paid.email,paid.start_at-interval '1 hour')
 ) j(kind,recipient,due_at) WHERE j.recipient<>'' AND (j.kind NOT LIKE 'reminder%' OR j.due_at>now())
 ON CONFLICT(booking_id,kind,recipient) DO NOTHING RETURNING id
 ) SELECT * FROM paid`,[id,sessionId]);
 if(rows[0]) {await addAudit("booking_paid",{bookingId:id});return mapBooking(rows[0]);}
 const existing=await getBookingById(id);
 if(existing?.paymentStatus==="paid" && existing.stripeSessionId===sessionId) return existing;
 throw new AppError("El pago requiere revisión administrativa",409,"PAYMENT_REVIEW");
}
export async function updateBookingAdmin(id:string,data:{status:"confirmed"|"completed"|"no_show"|"cancelled";adminNotes:string}):Promise<Booking> {
 const [row]=await query("UPDATE bookings SET status=$2,admin_notes=$3,updated_at=now() WHERE id=$1 AND payment_status='paid' AND status IN ('confirmed','completed','no_show','cancelled') RETURNING *",[id,data.status,data.adminNotes]);
 if(!row) throw new AppError("Solo puedes cambiar el estado de una reserva pagada y confirmada",409,"INVALID_STATUS");
 await addAudit("booking_admin_updated",{bookingId:id,status:data.status});
 return mapBooking(row);
}
export async function blockedSlots(from:string,to:string):Promise<Array<{startAt:string;blockedUntil:string}>> {return (await query("SELECT start_at,blocked_until FROM bookings WHERE status IN ('held','confirmed','payment_review') AND start_at<$2 AND blocked_until>$1",[from,to])).map((r)=>({startAt:iso(r.start_at),blockedUntil:iso(r.blocked_until)}));}
export interface NotificationJob {id:string;bookingId:string;kind:string;recipient:string;status:string;attempts:number;dueAt:string;sentAt:string|null;lastError:string|null;leaseToken:string|null;}
function mapJob(r:Record<string,unknown>):NotificationJob {return {id:String(r.id),bookingId:String(r.booking_id),kind:String(r.kind),recipient:String(r.recipient),status:String(r.status),attempts:Number(r.attempts),dueAt:iso(r.due_at),sentAt:r.sent_at?iso(r.sent_at):null,lastError:r.last_error?String(r.last_error):null,leaseToken:r.lease_token?String(r.lease_token):null};}
export async function listNotifications():Promise<NotificationJob[]> {return (await query("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 1000")).map(mapJob);}
export async function claimNotifications(limit=20):Promise<NotificationJob[]> {
 const token=randomUUID();
 return (await query(`UPDATE notifications SET status='sending',attempts=attempts+1,lease_token=$1,lease_until=now()+interval '5 minutes'
 WHERE id IN (SELECT id FROM notifications WHERE ((status='pending' AND due_at<=now()) OR (status='sending' AND lease_until<now())) AND attempts<6 ORDER BY due_at FOR UPDATE SKIP LOCKED LIMIT $2) RETURNING *`,[token,limit])).map(mapJob);
}
export async function finishNotification(job:NotificationJob,status:"sent"|"skipped"|"pending"|"failed"):Promise<void> {await query("UPDATE notifications SET status=$3,sent_at=CASE WHEN $3='sent' THEN now() ELSE sent_at END,last_error=CASE WHEN $3 IN ('pending','failed') THEN 'No se pudo enviar el correo. Revisa la configuración SMTP.' ELSE NULL END,due_at=CASE WHEN $3='pending' THEN now()+($4*interval '5 minutes') ELSE due_at END,lease_token=NULL,lease_until=NULL WHERE id=$1 AND lease_token=$2",[job.id,job.leaseToken,status,job.attempts]);}
export async function listAudit() {return await query("SELECT id,action,details,created_at AS \"createdAt\" FROM audit_log ORDER BY id DESC LIMIT 500");}
export async function addAudit(action:string,details:Record<string,unknown>={}) {await query("INSERT INTO audit_log(action,details) VALUES($1,$2::jsonb)",[action,JSON.stringify(details)]);}
export async function consumeRateLimit(key:string,limit:number,windowSeconds:number):Promise<void> {
 const [row]=await query(`INSERT INTO rate_limits(key,count,reset_at) VALUES($1,1,now()+($2*interval '1 second'))
 ON CONFLICT(key) DO UPDATE SET count=CASE WHEN rate_limits.reset_at<now() THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END RETURNING count`,[key,windowSeconds]);
 if(Number(row.count)>limit) throw new AppError("Demasiados intentos. Inténtalo en unos minutos.",429,"RATE_LIMITED");
}
export interface CalendarBlock {id:string;startAt:string;endAt:string;reason:string;}
export async function listBlocks():Promise<CalendarBlock[]> {return (await query("SELECT id,start_at,end_at,notes FROM bookings WHERE kind='block' AND status='confirmed' ORDER BY start_at LIMIT 500")).map((r)=>({id:String(r.id),startAt:iso(r.start_at),endAt:iso(r.end_at),reason:String(r.notes)}));}
export async function createBlock(data:{startAt:string;endAt:string;reason:string}):Promise<CalendarBlock> {
 const start=new Date(data.startAt),end=new Date(data.endAt);
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start||end.getTime()-start.getTime()>366*86400000||data.reason.length>500) throw new AppError("Revisa el periodo del bloqueo");
 const id=randomUUID();
 await query(`INSERT INTO bookings(id,kind,idempotency_key,payload_hash,customer_name,email,phone,topic,notes,start_at,end_at,blocked_until,timezone,meeting_type,host_name,admin_email,status,hold_expires_at)
 VALUES($1,'block',$1,'block','Bloqueo administrativo','','','Bloqueo',$2,$3,$4,$4,'America/New_York','pending','','','confirmed',$4)`,[id,data.reason,start.toISOString(),end.toISOString()]);
 await addAudit("calendar_block_created",{blockId:id,startAt:start.toISOString(),endAt:end.toISOString()});
 return {id,startAt:start.toISOString(),endAt:end.toISOString(),reason:data.reason};
}
export async function deleteBlock(id:string):Promise<void> {await query("UPDATE bookings SET status='cancelled',updated_at=now() WHERE id=$1 AND kind='block'",[id]);await addAudit("calendar_block_removed",{blockId:id});}
export async function retryNotification(id:string):Promise<void> {
 const rows=await query("UPDATE notifications SET status='pending',attempts=0,due_at=now(),last_error=NULL,lease_until=NULL,lease_token=NULL WHERE id=$1 AND status IN ('failed','pending') RETURNING id",[id]);
 if(!rows.length) throw new AppError("Solo puedes reintentar correos pendientes o fallidos",409);
 await addAudit("notification_retried",{notificationId:id});
}
