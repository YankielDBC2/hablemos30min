import { stripeClient } from '@/lib/stripe';
import { fulfillCheckout,processNotifications } from '@/lib/services';
import { json,handleError } from '@/lib/http';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request){
 const signature=request.headers.get('stripe-signature');
 if(!signature||!process.env.STRIPE_WEBHOOK_SECRET)return json({error:'Firma requerida.'},400);
 const text=await request.text();if(text.length>1000000)return json({error:'Solicitud demasiado grande.'},413);
 let event;
 try{event=stripeClient().webhooks.constructEvent(text,signature,process.env.STRIPE_WEBHOOK_SECRET);}catch{return json({error:'Firma inválida.'},400);}
 try{
  if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
   await fulfillCheckout(event.data.object.id);
   await processNotifications();
  }
  return json({received:true});
 }catch(e){return handleError(e);}
}
