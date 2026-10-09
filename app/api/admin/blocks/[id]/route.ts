import { requireAdmin } from '@/lib/auth';
import { deleteBlock } from '@/lib/repository';
import { json,handleError,checkOrigin } from '@/lib/http';
import { refreshPublicAgenda } from '@/lib/public-agenda';
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){try{checkOrigin(request);await requireAdmin();const {id}=await params;await deleteBlock(id);await refreshPublicAgenda();return json({ok:true});}catch(e){return handleError(e);}}
