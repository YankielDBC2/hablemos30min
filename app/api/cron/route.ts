import { timingSafeEqual } from 'node:crypto';
import { processNotifications } from '@/lib/services';
import { addAudit } from '@/lib/repository';
import { json,handleError } from '@/lib/http';
export const dynamic='force-dynamic';
export const maxDuration=60;
export async function GET(request:Request){
 const expected=process.env.CRON_SECRET?Buffer.from(`Bearer ${process.env.CRON_SECRET}`):null;
 const supplied=Buffer.from(request.headers.get('authorization')??'');
 if(!expected||expected.length!==supplied.length||!timingSafeEqual(expected,supplied))return json({error:'No autorizado.'},401);
 try{const result=await processNotifications();await addAudit('cron_completed',result);return json({ok:true,...result});}catch(e){return handleError(e);}
}
