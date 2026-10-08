import { getBooking } from '@/lib/services';
import { json,handleError } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const id=new URL(request.url).searchParams.get('session_id')??'';if(!/^cs_(test|live)_[a-zA-Z0-9]{10,200}$/.test(id))return json({error:'Referencia de pago inválida.'},400);return json(await getBooking(id));}catch(e){return handleError(e);}}
