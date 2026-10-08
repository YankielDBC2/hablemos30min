import type Stripe from "stripe";
import type { Booking } from "./repository";
import { AppError } from "./errors";
import { verifyPaidSession } from "./stripe";

export interface PaymentPorts {
 retrieve:(id:string)=>Promise<Stripe.Checkout.Session>;
 findBySession:(id:string)=>Promise<Booking|null>;
 getBookingById:(id:string)=>Promise<Booking|null>;
 markPaymentReview:(id:string)=>Promise<void>;
 confirmPaid:(id:string,sessionId:string)=>Promise<Booking>;
}
export async function fulfillPayment(sessionId:string,ports:PaymentPorts):Promise<Booking|null> {
 if(!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) throw new AppError("Referencia de pago inválida");
 const session=await ports.retrieve(sessionId);
 const booking=await ports.findBySession(sessionId) ?? (session.metadata?.bookingId?await ports.getBookingById(session.metadata.bookingId):null);
 if(!booking) throw new AppError("No encontramos esta reserva",404,"BOOKING_NOT_FOUND");
 if(session.payment_status!=="paid") return null;
 if(!verifyPaidSession(session,booking)) {await ports.markPaymentReview(booking.id);throw new AppError("El pago requiere revisión administrativa",409,"PAYMENT_REVIEW");}
 if(!["held","confirmed","completed","no_show","cancelled"].includes(booking.status)) {
  await ports.markPaymentReview(booking.id);
  throw new AppError("El pago requiere revisión administrativa",409,"PAYMENT_REVIEW");
 }
 return await ports.confirmPaid(booking.id,session.id);
}
