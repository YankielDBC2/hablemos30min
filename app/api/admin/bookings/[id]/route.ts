import { requireAdmin } from '@/lib/auth';
import { adminBookingSchema } from '@/lib/validation';
import { updateBookingAdmin } from '@/lib/repository';
import { json,handleError,checkOrigin,readBody } from '@/lib/http';
import { refreshPublicAgenda } from '@/lib/public-agenda';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{checkOrigin(request);await requireAdmin();const {id}=await params;const data=adminBookingSchema.parse(await readBody(request));const booking=await updateBookingAdmin(id,data);await refreshPublicAgenda();return json({ok:true,booking});}catch(e){return handleError(e);}}
