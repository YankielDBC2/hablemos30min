import { requireAdmin } from '@/lib/auth';
import { listBookings } from '@/lib/repository';
import { handleError } from '@/lib/http';
export const dynamic='force-dynamic';
function cell(value:unknown){let text=String(value??'');if(/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export async function GET(){try{await requireAdmin();const bookings=await listBookings();const header=['Referencia','Nombre','Correo','Celular','Inicio UTC','Zona horaria','Tema','Estado','Pago','USD','Notas cliente','Notas internas'];const rows=bookings.map(b=>[b.id,b.customerName,b.email,b.phone,b.startAt,b.timezone,b.topic,b.status,b.paymentStatus,b.priceCents/100,b.notes,b.adminNotes]);return new Response('\ufeff'+[header,...rows].map(row=>row.map(cell).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="reservas-hablemos30min.csv"','Cache-Control':'no-store'}});}catch(e){return handleError(e);}}
