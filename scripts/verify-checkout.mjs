import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import Stripe from 'stripe';
import {neon} from '@neondatabase/serverless';
const env=JSON.parse(await fs.readFile('.private/production-env.json','utf8'));
const stripe=new Stripe(env.STRIPE_SECRET_KEY),sql=neon(env.DATABASE_URL),origin='https://hablemos30min.online';
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit'}).formatToParts(new Date());
const month=parts.find(x=>x.type==='year').value+'-'+parts.find(x=>x.type==='month').value;
const agenda=await fetch(`${origin}/api/availability?month=${month}&timezone=America%2FNew_York`).then(r=>r.json());
const input={name:'Verificación interna — no pagar',email:'business@hablemos30min.online',phone:'+19797301283',topic:'Verificación técnica del pago',notes:'Checkout de comprobación. No realizar pagos.',callChannel:'phone',startAt:agenda.slots[0],timezone:'America/New_York',acceptedPolicy:true,idempotencyKey:randomUUID()};
const options={method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input)};
let session;
try{
 const r=await fetch(origin+'/api/checkout',options),out=await r.json();if(!r.ok)throw new Error('Checkout status '+r.status+' '+out.error);
 const rows=await sql.query('SELECT id,stripe_session_id FROM bookings WHERE idempotency_key=$1',[input.idempotencyKey]);
 session=await stripe.checkout.sessions.retrieve(rows[0].stripe_session_id);
 if(session.amount_total!==4900||session.currency!=='usd'||session.mode!=='payment'||session.payment_status!=='unpaid'||session.locale!=='es')throw new Error('Checkout invariant failed');
 const retry=await fetch(origin+'/api/checkout',options).then(r=>r.json());if(retry.url!==out.url)throw new Error('Idempotency failed');
 const pending=await fetch(origin+'/api/booking?session_id='+session.id).then(r=>r.json());if(pending.status!=='pending')throw new Error('Unpaid checkout incorrectly confirmed');
 console.log('Live Stripe checkout verified: 49 USD, one payment, Spanish, unpaid, idempotent; no charge made');
 await fs.writeFile('.private/checkout-verification.json',JSON.stringify({amount:session.amount_total,currency:session.currency,mode:session.mode,locale:session.locale,status:session.payment_status,idempotent:true,confirmation:'pending'},null,2));
}finally{
 if(session?.status==='open'){
  const expired=await stripe.checkout.sessions.expire(session.id);
  if(expired.status==='expired'&&expired.payment_status==='unpaid'){
   await sql.query("UPDATE bookings SET status='expired',updated_at=now() WHERE stripe_session_id=$1 AND status='held' AND payment_status='unpaid' AND customer_name=$2",[session.id,input.name]);
   await sql.query("INSERT INTO audit_log(action,details) VALUES('internal_checkout_verified',$1::jsonb)",[JSON.stringify({amountCents:4900,noCharge:true,expired:true})]);
   console.log('Internal checkout expired; slot released after Stripe verification');
  }
 }
}
