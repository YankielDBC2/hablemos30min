import { passwordMatches,createSession,setAdminCookie,HttpError } from '@/lib/auth';
import { consumeRateLimit,addAudit } from '@/lib/repository';
import { json,handleError,checkOrigin,readBody,clientIp } from '@/lib/http';
export async function POST(request:Request){try{checkOrigin(request);const {password}=await readBody(request);await consumeRateLimit(`admin-login:${clientIp(request)}`,8,900);if(typeof password!=='string'||!passwordMatches(password))throw new HttpError('Contraseña incorrecta.',401);await setAdminCookie(createSession());await addAudit('admin_login',{});return json({ok:true});}catch(e){return handleError(e);}}
