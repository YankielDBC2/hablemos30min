import { neon } from "@neondatabase/serverless";
import { AppError } from "./errors";

export async function query<T extends Record<string,unknown> = Record<string,unknown>>(statement:string,params:unknown[]=[]):Promise<T[]> {
  if(process.env.DATABASE_MAINTENANCE==='1') throw new AppError('El sistema de reservas está en mantenimiento. Inténtalo en unos minutos.',503,'MAINTENANCE');
  if(!process.env.DATABASE_URL) throw new AppError("El servicio de reservas aún no está configurado",503,"NOT_CONFIGURED");
  try {
    const sql=neon(process.env.DATABASE_URL);
    return await sql.query(statement,params) as T[];
  } catch(error) {
    const code=(error as {code?:string}).code;
    if(code==="23P01") throw new AppError("Este horario acaba de ser reservado. Elige otro.",409,"SLOT_TAKEN");
    if(code==="23505") throw new AppError("La solicitud ya existe",409,"DUPLICATE_REQUEST");
    console.error("database_operation_failed",{code:code??"unknown"});
    throw new AppError("No pudimos completar la operación. Inténtalo de nuevo.",503,"DATABASE_UNAVAILABLE");
  }
}
