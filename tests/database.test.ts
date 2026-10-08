import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

test("PostgreSQL real: cinco reservas simultáneas, bloqueos y holds vencidos mantienen exclusión",{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const sql=neon(process.env.TEST_DATABASE_URL!);
 const schema=`test_h30_${randomUUID().replace(/-/g,"")}`;
 const ddl=await readFile(new URL("../db/schema.sql",import.meta.url),"utf8");
 await sql.query(`CREATE SCHEMA "${schema}"`);
 try {
  const statements=ddl.split(";").map((s)=>s.trim()).filter((s)=>s&&!s.startsWith("CREATE EXTENSION"));
  await sql.transaction([sql.query(`SET LOCAL search_path TO "${schema}",public`),...statements.map((s)=>sql.query(s))]);
  const insert=(id:string,kind="booking",status="held")=>sql.query(`INSERT INTO "${schema}".bookings(id,kind,idempotency_key,payload_hash,customer_name,email,phone,topic,start_at,end_at,blocked_until,timezone,meeting_type,host_name,admin_email,status,hold_expires_at)
   VALUES($1,$2,$1,'test','Prueba','test@example.invalid','+13055550100','Test','2035-01-01T14:00:00Z','2035-01-01T14:30:00Z','2035-01-01T14:45:00Z','America/New_York','phone','Prueba','test@example.invalid',$3,now()-interval '1 minute') RETURNING id`,[id,kind,status]);
  const attempts=await Promise.allSettled(Array.from({length:5},()=>insert(randomUUID())));
  const success=attempts.filter((r)=>r.status==="fulfilled");
  assert.equal(success.length,1,"Solo una reserva puede adquirir el horario");
  for(const result of attempts) if(result.status==="rejected") assert.equal(result.reason.code,"23P01");
  await assert.rejects(insert(randomUUID(),"block","confirmed"),(error:unknown)=>(error as {code:string}).code==="23P01");
  await assert.rejects(insert(randomUUID()),(error:unknown)=>(error as {code:string}).code==="23P01","Un hold vencido no libera el horario sin conciliación Stripe");
  const [{id}]=await sql.query(`SELECT id FROM "${schema}".bookings`);
  await sql.query(`UPDATE "${schema}".bookings SET status='expired' WHERE id=$1`,[id]);
  await insert(randomUUID(),"block","confirmed");
  await assert.rejects(insert(randomUUID()),(error:unknown)=>(error as {code:string}).code==="23P01","Los bloqueos administrativos también impiden nuevas reservas");
 } finally {
  // Only the fresh random test schema is removed; production data is never touched.
  assert.match(schema,/^test_h30_[a-f0-9]{32}$/);
  await sql.query(`DROP SCHEMA "${schema}" CASCADE`);
 }
});
