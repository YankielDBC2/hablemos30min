import { test } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { checkoutSchema,DEFAULT_SETTINGS,settingsSchema } from "../lib/validation";
import { generateSlots,isBookableStart,localToUtc,overlaps } from "../lib/scheduling";
import { verifyPaidSession,isHablemosCheckout } from "../lib/stripe";
import { bookingIcs,escapeIcs } from "../lib/mail";
import type { Booking } from "../lib/repository";
import { fulfillPayment,expireUnpaidCheckout,type PaymentPorts,type ExpirationPorts } from "../lib/payment-service";

const settings={...DEFAULT_SETTINGS,bookingEnabled:true,meetingType:"phone" as const,adminEmail:"anfitrion@example.com"};
const booking:Booking={id:"9b10a9a6-18f5-4664-ade0-90129ac1dd19",idempotencyKey:"7e862a20-fc5c-4020-9268-1168b9c6d8d0",payloadHash:"hash",customerName:"Cliente",email:"cliente@example.com",phone:"+1 305 555 0100",topic:"Consulta",notes:"",adminNotes:"",startAt:"2026-11-02T14:00:00Z",endAt:"2026-11-02T14:30:00Z",blockedUntil:"2026-11-02T14:30:00Z",timezone:"America/New_York",meetingType:"phone",meetingUrl:"",hostName:"Yankiel",adminEmail:"anfitrion@example.com",status:"held",paymentStatus:"unpaid",priceCents:4900,currency:"usd",stripeSessionId:"cs_test_example",holdExpiresAt:"2026-10-05T22:00:00Z",createdAt:"2026-10-05T21:00:00Z",paidAt:null};
const paid={id:"cs_test_example",mode:"payment",status:"complete",payment_status:"paid",amount_total:4900,currency:"usd",metadata:{bookingId:booking.id,policy:"no-refunds-v1",duration:"30"},client_reference_id:booking.id} as unknown as Stripe.Checkout.Session;

test('Eventos Stripe de otros productos se ignoran antes de consultar Neon',()=>{
 assert.equal(isHablemosCheckout(paid),true);
 assert.equal(isHablemosCheckout({...paid,status:'expired',payment_status:'unpaid'} as Stripe.Checkout.Session),true);
 for(const patch of [{metadata:{}},{client_reference_id:'otro'},{amount_total:1000},{mode:'subscription'},{metadata:{bookingId:'no-uuid',policy:'no-refunds-v1',duration:'30'}}]){
  assert.equal(isHablemosCheckout({...paid,...patch} as Stripe.Checkout.Session),false);
 }
});

test('Solo Stripe expirado y sin pagar libera un hold propio; no hay conciliación periódica',async()=>{
 let expired=0;
 const ports:ExpirationPorts={retrieve:async()=>({...paid,status:'expired',payment_status:'unpaid'} as Stripe.Checkout.Session),findBySession:async()=>booking,expireVerifiedHold:async(id)=>{assert.equal(id,booking.id);expired++;}};
 assert.equal(await expireUnpaidCheckout(paid.id,ports),true);
 assert.equal(expired,1);
 ports.retrieve=async()=>paid;
 assert.equal(await expireUnpaidCheckout(paid.id,ports),false);
 ports.retrieve=async()=>({...paid,status:'open',payment_status:'unpaid'} as Stripe.Checkout.Session);
 assert.equal(await expireUnpaidCheckout(paid.id,ports),false);
 ports.retrieve=async()=>({...paid,status:'expired',payment_status:'unpaid'} as Stripe.Checkout.Session);
 ports.findBySession=async()=>({...booking,paymentStatus:'paid',status:'confirmed'});
 assert.equal(await expireUnpaidCheckout(paid.id,ports),false);
 ports.findBySession=async()=>({...booking,stripeSessionId:'cs_test_other'});
 assert.equal(await expireUnpaidCheckout(paid.id,ports),false);
 assert.equal(expired,1);
});

test("Se exige celular, política aceptada y UUID; no se acepta alterar precio",()=>{
 const valid={name:"Ana Pérez",email:"ana@example.com",phone:"+1 305 555 0100",topic:"Proyecto",notes:"",startAt:"2026-11-02T14:00:00Z",timezone:"America/New_York",acceptedPolicy:true,idempotencyKey:booking.idempotencyKey};
 assert.equal(checkoutSchema.safeParse(valid).success,true);
 for(const patch of [{phone:""},{acceptedPolicy:false},{price:1},{timezone:"inventada"},{idempotencyKey:"x"}]) assert.equal(checkoutSchema.safeParse({...valid,...patch}).success,false);
});
test("Reservas no abren sin canal y correo o videollamada sin enlace",()=>{
 assert.equal(settingsSchema.safeParse({...DEFAULT_SETTINGS,bookingEnabled:true,meetingType:"pending",adminEmail:""}).success,false);
 assert.equal(settingsSchema.safeParse(settings).success,true);
 assert.equal(settingsSchema.safeParse({...settings,meetingType:"zoom",meetingUrl:""}).success,false);
 assert.equal(settingsSchema.safeParse({...settings,weeklyHours:settings.weeklyHours.map((v)=>({...v,day:1}))}).success,false);
});
test("Horario Miami respeta DST, domingo cerrado y límites de 30 minutos",()=>{
 const now=new Date("2026-10-05T00:00:00Z");
 assert.equal(isBookableStart(new Date("2026-10-30T13:00:00Z"),settings,now),true);
 assert.equal(isBookableStart(new Date("2026-11-02T14:00:00Z"),settings,now),true);
 assert.equal(isBookableStart(new Date("2026-11-02T13:00:00Z"),settings,now),false);
 assert.equal(isBookableStart(new Date("2026-11-01T14:00:00Z"),settings,now),false);
 assert.equal(isBookableStart(new Date("2026-11-02T00:00:00Z"),settings,now),false);
 assert.equal(isBookableStart(new Date("2026-11-02T14:15:00Z"),settings,now),false);
 assert.equal(localToUtc(2026,3,8,2,30,"America/New_York"),null);
 assert.equal(localToUtc(2026,11,2,9,0,"America/New_York")?.toISOString(),"2026-11-02T14:00:00.000Z");
 const sunday={...settings,weeklyHours:settings.weeklyHours.map((day)=>day.day===0?{...day,enabled:true,start:"01:00",end:"03:00"}:day)};
 assert.equal(isBookableStart(new Date("2026-11-01T05:30:00Z"),sunday,now),true);
 assert.equal(isBookableStart(new Date("2026-11-01T06:30:00Z"),sunday,now),false);
});
test("Disponibilidad muestra mes de cliente y buffer sin sobrepasar cierre",()=>{
 const now=new Date("2026-10-05T00:00:00Z");
 const slots=generateSlots("2026-11","Europe/Madrid",{...settings,bufferMinutes:15},now);
 assert.ok(slots.includes("2026-11-02T14:00:00.000Z"));
 assert.ok(slots.includes("2026-11-02T14:45:00.000Z"));
 assert.equal(slots.includes("2026-11-02T14:30:00.000Z"),false);
 assert.equal(new Set(slots).size,slots.length);
 assert.equal(overlaps("2026-11-02T14:30:00Z","2026-11-02T15:00:00Z","2026-11-02T14:00:00Z","2026-11-02T14:45:00Z"),true);
 assert.equal(overlaps("2026-11-02T14:45:00Z","2026-11-02T15:15:00Z","2026-11-02T14:00:00Z","2026-11-02T14:45:00Z"),false);
});
test("Confirmar exige Stripe pagado y exactos importe, moneda y reserva",()=>{
 assert.equal(verifyPaidSession(paid,booking),true);
 for(const patch of [{payment_status:"unpaid"},{status:"open"},{amount_total:49},{currency:"eur"},{client_reference_id:"another"},{metadata:{bookingId:booking.id,policy:"other",duration:"30"}},{id:"cs_test_other"}]) assert.equal(verifyPaidSession({...paid,...patch} as Stripe.Checkout.Session,booking),false);
});
test("ICS no permite inyección y preserva caracteres y hora UTC",()=>{
 const file=bookingIcs({...booking,hostName:"Yankiel\nBEGIN:VEVENT;secreto,otro"});
 assert.equal(file.split("\r\n").filter((line)=>line==="BEGIN:VEVENT").length,1);
 assert.ok(file.includes("Yankiel\\nBEGIN:VEVENT\\;secreto\\,otro"));
 assert.ok(file.includes("DTSTART:20261102T140000Z"));
 assert.equal(file.split("\r\n").filter(line=>line==='BEGIN:VALARM').length,2);
 assert.ok(file.includes('TRIGGER:-P1D'));
 assert.ok(file.includes('TRIGGER:-PT1H'));
 assert.equal(escapeIcs("a\\b\r\nc,d;e"),"a\\\\b\\nc\\,d\\;e");
 for(const line of file.split("\r\n")) assert.ok(Buffer.byteLength(line)<=74);
});
test("Un checkout pendiente no confirma ni encola correos; un pago ajeno exige revisión",async()=>{
 let confirmed=0,reviewed=0;
 const ports:PaymentPorts={retrieve:async()=>({...paid,payment_status:"unpaid"} as Stripe.Checkout.Session),findBySession:async()=>booking,getBookingById:async()=>booking,markPaymentReview:async()=>{reviewed++;},confirmPaid:async()=>{confirmed++;return booking;}};
 assert.equal(await fulfillPayment(paid.id,ports),null);
 assert.equal(confirmed,0);
 ports.retrieve=async()=>({...paid,amount_total:1} as Stripe.Checkout.Session);
 await assert.rejects(fulfillPayment(paid.id,ports),/revisión/);
 assert.equal(confirmed,0);assert.equal(reviewed,1);
});
test("Pago válido recupera hold por metadata y no reactiva una reserva liberada",async()=>{
 let confirmed=0;
 const ports:PaymentPorts={retrieve:async()=>paid,findBySession:async()=>null,getBookingById:async()=>booking,markPaymentReview:async()=>{},confirmPaid:async(id,sessionId)=>{assert.equal(id,booking.id);assert.equal(sessionId,paid.id);confirmed++;return {...booking,status:"confirmed",paymentStatus:"paid"};}};
 assert.equal((await fulfillPayment(paid.id,ports))?.paymentStatus,"paid");
 assert.equal(confirmed,1);
 ports.getBookingById=async()=>({...booking,status:"expired"});
 await assert.rejects(fulfillPayment(paid.id,ports),/revisión/);
 assert.equal(confirmed,1);
});
