import { fulfillCheckout } from '@/lib/services';
import { bookingIcs } from '@/lib/mail';
import { handleError,json } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const id=new URL(request.url).searchParams.get('session_id')??'';if(!/^cs_(test|live)_[a-zA-Z0-9]{10,200}$/.test(id))return json({error:'Referencia inválida.'},400);const booking=await fulfillCheckout(id);if(!booking||booking.status!=='confirmed')return json({error:'La reserva todavía no está confirmada.'},409);return new Response(bookingIcs(booking),{headers:{'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'attachment; filename="hablemos30min.ics"','Cache-Control':'no-store'}});}catch(e){return handleError(e);}}
