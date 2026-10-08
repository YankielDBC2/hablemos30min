import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { createBlock } from '@/lib/repository';
import { json,handleError,checkOrigin,readBody } from '@/lib/http';
const schema=z.object({startAt:z.iso.datetime({offset:true}),endAt:z.iso.datetime({offset:true}),reason:z.string().trim().min(1).max(250)}).refine(d=>Date.parse(d.endAt)>Date.parse(d.startAt)&&Date.parse(d.endAt)-Date.parse(d.startAt)<366*86400000,'El fin debe ser posterior al inicio, con un máximo de un año.');
export async function POST(request:Request){try{checkOrigin(request);await requireAdmin();const data=schema.parse(await readBody(request));const block=await createBlock(data);return json({ok:true,block});}catch(e){return handleError(e);}}
