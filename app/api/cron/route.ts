import { json } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){
 return json({error:'El procesamiento periódico está desactivado.'},410);
}
