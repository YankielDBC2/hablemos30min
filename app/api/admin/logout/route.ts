import { clearAdminCookie } from '@/lib/auth';
import { json,handleError,checkOrigin } from '@/lib/http';
export async function POST(request:Request){try{checkOrigin(request);await clearAdminCookie();return json({ok:true});}catch(e){return handleError(e);}}
