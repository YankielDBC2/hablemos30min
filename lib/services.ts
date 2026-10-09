import { createHash } from "node:crypto";
import { AppError } from "./errors";
import * as repository from "./repository";
import { checkoutSchema, type CheckoutInput } from "./validation";
import { isBookableStart } from "./scheduling";
import { createStripeSession, stripeClient } from "./stripe";
import { fulfillPayment, expireUnpaidCheckout } from "./payment-service";
import { sendBookingNotification } from "./mail";
import { publicAvailability, refreshPublicAgenda } from './public-agenda';

export async function getAvailability(month:string,timezone:string) {
 return publicAvailability(month,timezone);
}
export async function createCheckout(raw:CheckoutInput,ip:string):Promise<{url:string}> {
 const input=checkoutSchema.parse(raw);
 const settings=await repository.getSettings();
 if(!settings.bookingEnabled) throw new AppError("Las reservas están pausadas por el momento",409,"BOOKING_PAUSED");
 if(!process.env.STRIPE_SECRET_KEY || !process.env.APP_URL) throw new AppError("El sistema de pago aún no está configurado",503,"NOT_CONFIGURED");
 const hash=createHash("sha256").update(JSON.stringify({...input,startAt:new Date(input.startAt).toISOString()})).digest("hex");
 await repository.consumeRateLimit(`checkout:${createHash("sha256").update(ip).digest("hex")}`,12,3600);
 let booking=await repository.findByIdempotency(input.idempotencyKey);
 if(booking && booking.payloadHash!==hash) throw new AppError("La solicitud cambió. Actualiza la página antes de continuar.",409,"IDEMPOTENCY_MISMATCH");
 if(!booking) {
  if(!isBookableStart(new Date(input.startAt),settings)) throw new AppError("El horario seleccionado ya no está disponible",409,"INVALID_SLOT");
  booking=await repository.createHold(input,hash,settings,new Date(Date.now()+32*60000));
  await refreshPublicAgenda();
  if(booking.payloadHash!==hash) throw new AppError("La solicitud cambió. Actualiza la página.",409,"IDEMPOTENCY_MISMATCH");
 }
 if(booking.status!=="held") throw new AppError("Esta solicitud ya fue procesada. Consulta tu correo o selecciona otro horario.",409,"BOOKING_PROCESSED");
 try {
  const session=booking.stripeSessionId?await stripeClient().checkout.sessions.retrieve(booking.stripeSessionId):await createStripeSession(booking);
  await repository.attachSession(booking.id,session.id,session.expires_at);
  if(session.status!=="open"||!session.url) throw new AppError("El enlace de pago expiró. Elige de nuevo tu horario.",409,"CHECKOUT_EXPIRED");
  return {url:session.url};
 } catch(error) {
  if(error instanceof AppError) throw error;
  // Never release an ambiguous hold: a Stripe session may have been created despite a network timeout.
  throw new AppError("No pudimos abrir el pago. Reintenta con los mismos datos.",503,"PAYMENT_UNAVAILABLE");
 }
}
export async function fulfillCheckout(sessionId:string):Promise<repository.Booking|null> {
 return await fulfillPayment(sessionId,{retrieve:(id)=>stripeClient().checkout.sessions.retrieve(id),findBySession:repository.findBySession,getBookingById:repository.getBookingById,markPaymentReview:repository.markPaymentReview,confirmPaid:repository.confirmPaid});
}
export async function getBooking(sessionId:string) {
 const booking=await fulfillCheckout(sessionId);
 if(!booking) return {status:"pending",booking:null};
 return {status:booking.status,booking:{id:booking.id,name:booking.customerName,startAt:booking.startAt,endAt:booking.endAt,timezone:booking.timezone,meetingType:booking.meetingType,meetingUrl:booking.meetingUrl,phone:booking.phone}};
}
async function releaseExpiredHolds(deadline:number) {
 let changed=false;
 for(const booking of await repository.listExpiredHolds()) {
  if(Date.now()>deadline) break;
  try {
   const session=booking.stripeSessionId?await stripeClient().checkout.sessions.retrieve(booking.stripeSessionId):await createStripeSession(booking);
   if(!booking.stripeSessionId) await repository.attachSession(booking.id,session.id,session.expires_at);
   if(session.payment_status==="paid") await fulfillCheckout(session.id);
   else if(session.status==="expired" && session.payment_status==="unpaid") {await repository.expireVerifiedHold(booking.id);changed=true;}
  } catch(error) {console.error("hold_reconciliation_failed",{bookingId:booking.id,code:error instanceof AppError?error.code:"STRIPE_UNAVAILABLE"});}
 }
 if(changed) await refreshPublicAgenda();
}
export async function expireCheckout(sessionId:string) {
 const changed=await expireUnpaidCheckout(sessionId,{retrieve:(id)=>stripeClient().checkout.sessions.retrieve(id),findBySession:repository.findBySession,expireVerifiedHold:repository.expireVerifiedHold});
 if(changed) await refreshPublicAgenda();
}
export async function processNotifications() {
 const began=Date.now();
 await releaseExpiredHolds(began+15000);
 const result={sent:0,failed:0,skipped:0};
 // Process one lease at a time so sequential SMTP waits never outlive queued leases.
 for(let index=0;index<20;index++) {
  if(Date.now()-began>35000) break;
  const [job]=await repository.claimNotifications(1);
  if(!job) break;
  const booking=await repository.getBookingById(job.bookingId);
  if(!booking || booking.paymentStatus!=="paid" || booking.status!=="confirmed" || (job.kind.startsWith("reminder") && Date.parse(booking.startAt)<Date.now())) {await repository.finishNotification(job,"skipped");result.skipped++;continue;}
  try {await sendBookingNotification(job,booking);await repository.finishNotification(job,"sent");result.sent++;}
  catch {await repository.finishNotification(job,job.attempts>=6?"failed":"pending");result.failed++;}
 }
 return result;
}
