import { requireAdmin } from '@/lib/auth';
import { retryNotification } from '@/lib/repository';
import { processNotifications } from '@/lib/services';
import { json,handleError,checkOrigin,readBody } from '@/lib/http';
import { z } from 'zod';
export async function POST(request:Request){try{checkOrigin(request);await requireAdmin();const {id}=z.object({id:z.uuid()}).parse(await readBody(request));await retryNotification(id);await processNotifications();return json({ok:true});}catch(e){return handleError(e);}}
