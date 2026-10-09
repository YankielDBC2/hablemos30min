import nodemailer from "nodemailer";
import type { Booking, NotificationJob } from "./repository";
import { AppError } from "./errors";

function escapeHtml(value:string) {return value.replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]!));}
export function escapeIcs(value:string) {return value.replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r/g,"");}
function foldIcs(line:string) {
 const result:string[]=[];let current="";let size=0;
 for(const char of line) {const bytes=Buffer.byteLength(char);if(size+bytes>74){result.push(current);current=" ";size=1;}current+=char;size+=bytes;}
 result.push(current);return result.join("\r\n");
}
export function bookingIcs(booking:Booking):string {
 const stamp=(date:string)=>new Date(date).toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
 const channel={phone:"Llamada telefónica",whatsapp:"WhatsApp",google_meet:"Google Meet",zoom:"Zoom",pending:"Por confirmar"}[booking.meetingType]??booking.meetingType;
 return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Hablemos30min//Reservas ES//ES","CALSCALE:GREGORIAN","METHOD:PUBLISH","BEGIN:VEVENT",`UID:${booking.id}@hablemos30min.online`,`DTSTAMP:${stamp(booking.createdAt)}`,`DTSTART:${stamp(booking.startAt)}`,`DTEND:${stamp(booking.endAt)}`,`SUMMARY:${escapeIcs("Hablemos30min · Consulta con "+booking.hostName)}`,`DESCRIPTION:${escapeIcs(`Consulta de 30 minutos. Canal: ${channel}. ${booking.meetingUrl || "Te llamaremos al celular indicado."} Pago único de 49 USD. Sin reembolsos.`)}`,`LOCATION:${escapeIcs(booking.meetingUrl||channel)}`,"STATUS:CONFIRMED",...['-P1D','-PT1H'].flatMap(trigger=>['BEGIN:VALARM','ACTION:DISPLAY',`TRIGGER:${trigger}`,'DESCRIPTION:Tu consulta Hablemos30min se acerca.','END:VALARM']),"END:VEVENT","END:VCALENDAR"].map(foldIcs).join("\r\n")+"\r\n";
}
export async function sendBookingNotification(job:NotificationJob,booking:Booking):Promise<void> {
 const {SMTP_HOST,SMTP_USER,SMTP_PASS,MAIL_FROM}=process.env;
 if(!SMTP_HOST||!SMTP_USER||!SMTP_PASS||!MAIL_FROM) throw new AppError("Correo no configurado",503);
 const admin=job.kind==="admin_confirmation",reminder=job.kind.startsWith("reminder");
 const when=new Intl.DateTimeFormat("es",{timeZone:booking.timezone,dateStyle:"full",timeStyle:"short"}).format(new Date(booking.startAt));
 const hostWhen=new Intl.DateTimeFormat("es",{timeZone:"America/New_York",dateStyle:"full",timeStyle:"short"}).format(new Date(booking.startAt));
 const title=admin?"Nueva reserva pagada":reminder?"Tu consulta se acerca":"Tu consulta está confirmada";
 const channel={phone:"Llamada telefónica",whatsapp:"WhatsApp",google_meet:"Google Meet",zoom:"Zoom",pending:"Por confirmar"}[booking.meetingType]??booking.meetingType;
 const lines=[`${title}, ${admin?booking.hostName:booking.customerName}.`,"",`Fecha: ${admin?hostWhen:when}`,`Zona horaria: ${admin?"America/New_York":booking.timezone}`,"Duración: 30 minutos",`Canal: ${channel}`,booking.meetingUrl?`Enlace: ${booking.meetingUrl}`:`Celular para la llamada: ${booking.phone}`,"Pago: 49 USD, pago único. Sin reembolsos.",`Reserva: ${booking.id}`];
 if(admin) lines.push("",`Cliente: ${booking.customerName}`,`Correo: ${booking.email}`,`Celular: ${booking.phone}`,`Tema: ${booking.topic}`,`Notas: ${booking.notes||"Sin notas"}`);
 lines.push("","Gracias por reservar en Hablemos30min.");
 const text=lines.join("\n");
 const transport=nodemailer.createTransport({host:SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:Number(process.env.SMTP_PORT||465)===465,auth:{user:SMTP_USER,pass:SMTP_PASS},connectionTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
 await transport.sendMail({from:MAIL_FROM,to:job.recipient,subject:`${title} · Hablemos30min`,text,html:`<div style="font-family:Arial,sans-serif;color:#202526;line-height:1.6;max-width:600px"><h1 style="font-size:24px;color:#173be8">${title}</h1>${escapeHtml(text).split("\n").map((line)=>`<div>${line||"&nbsp;"}</div>`).join("")}</div>`,messageId:`<${job.id}@hablemos30min.online>`,attachments:[{filename:"hablemos30min.ics",content:bookingIcs(booking),contentType:"text/calendar; charset=utf-8; method=PUBLISH"}]});
}
