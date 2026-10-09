import { getAvailability } from '@/lib/services';
import { json,handleError } from '@/lib/http';
export async function GET(request:Request){try{const p=new URL(request.url).searchParams;return json(await getAvailability(p.get('month')??'',p.get('timezone')??'America/New_York'));}catch(e){return handleError(e);}}
