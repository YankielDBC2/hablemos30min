import Stripe from "stripe";
import { AppError } from "./errors";
import type { Booking } from "./repository";
import { DURATION_MINUTES, PRICE_CENTS } from "./validation";

export function stripeClient():Stripe {
 if(!process.env.STRIPE_SECRET_KEY) throw new AppError("El pago todavía no está configurado",503,"NOT_CONFIGURED");
 return new Stripe(process.env.STRIPE_SECRET_KEY,{maxNetworkRetries:2,timeout:15000});
}
export async function createStripeSession(booking:Booking) {
 const origin=process.env.APP_URL;
 if(!origin || !/^https?:\/\//.test(origin)) throw new AppError("Falta configurar la dirección de la aplicación",503,"NOT_CONFIGURED");
 return await stripeClient().checkout.sessions.create({
  mode:"payment",locale:"es",payment_method_types:["card"],client_reference_id:booking.id,customer_email:booking.email,
  expires_at:Math.floor(Date.parse(booking.holdExpiresAt)/1000),
  line_items:[{quantity:1,price_data:{currency:"usd",unit_amount:PRICE_CENTS,product_data:{name:"Hablemos30min · Consulta de 30 minutos",description:"Una llamada de 30 minutos. Pago único. Sin reembolsos."}}}],
  metadata:{bookingId:booking.id,policy:"no-refunds-v1",duration:String(DURATION_MINUTES)},
  payment_intent_data:{metadata:{bookingId:booking.id}},
  success_url:`${origin.replace(/\/$/,"")}/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url:`${origin.replace(/\/$/,"")}/?cancelado=1#reservar`,
  custom_text:{submit:{message:"Al pagar, aceptas el precio de 49 USD por 30 minutos y la política sin reembolsos."}},
 },{idempotencyKey:`h30-booking-${booking.id}`});
}
export function verifyPaidSession(session:Stripe.Checkout.Session,booking:Booking):boolean {
 return session.mode==="payment" && session.status==="complete" && session.payment_status==="paid" && session.amount_total===PRICE_CENTS && session.currency==="usd" && session.metadata?.bookingId===booking.id && session.client_reference_id===booking.id && session.metadata?.policy==="no-refunds-v1" && session.metadata?.duration==="30" && (!booking.stripeSessionId || booking.stripeSessionId===session.id);
}
export function isHablemosCheckout(session:Stripe.Checkout.Session):boolean {
 const id=session.metadata?.bookingId;
 return session.mode==='payment' && session.amount_total===PRICE_CENTS && session.currency==='usd' && typeof id==='string'
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  && session.client_reference_id===id && session.metadata?.policy==='no-refunds-v1' && session.metadata?.duration===String(DURATION_MINUTES);
}
