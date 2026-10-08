import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import Stripe from 'stripe';
const env=JSON.parse(await fs.readFile('.private/runtime-env.json','utf8'));
env.APP_URL='https://hablemos30min.online';
const stripe=new Stripe(env.STRIPE_SECRET_KEY);
const webhooks=await stripe.webhookEndpoints.list({limit:100});
let hook=webhooks.data.find(w=>w.url===env.APP_URL+'/api/webhooks/stripe');
if(!hook){hook=await stripe.webhookEndpoints.create({url:env.APP_URL+'/api/webhooks/stripe',enabled_events:['checkout.session.completed','checkout.session.async_payment_succeeded'],description:'Hablemos30min reservas 49 USD'});await fs.writeFile('.private/stripe-webhook.json',JSON.stringify(hook));}
const receipt=JSON.parse(await fs.readFile('.private/stripe-webhook.json','utf8'));
env.STRIPE_WEBHOOK_SECRET=receipt.secret;
await fs.writeFile('.private/production-env.json',JSON.stringify(env,null,2));
const cli=process.env.APPDATA+'/npm/node_modules/vercel/dist/vc.js';
const cleanEnv={...process.env};delete cleanEnv.VERCEL_TOKEN;
for(const [name,value] of Object.entries(env)){
 const code=await new Promise((resolve)=>{const child=spawn(process.execPath,[cli,'env','add',name,'production','--scope','telegram-bots-projects-871f5ac8','--force'],{env:cleanEnv,stdio:['pipe','pipe','pipe'],windowsHide:true});child.stdin.end(value+'\n');child.on('close',resolve);child.on('error',()=>resolve(1));});
 console.log('Production env',name,code===0?'configured':'FAILED');if(code!==0)throw new Error('Environment configuration failed');
}
console.log('Stripe webhook and Vercel environment ready');
