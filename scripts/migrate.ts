import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { DEFAULT_SETTINGS } from "../lib/validation";

if(existsSync(".env.local")) process.loadEnvFile(".env.local");
if(!process.env.DATABASE_URL) throw new Error("Configura DATABASE_URL para este proyecto");
const sql=neon(process.env.DATABASE_URL);
const schema=await readFile(new URL("../db/schema.sql",import.meta.url),"utf8");
await sql.transaction(schema.split(";").map((s)=>s.trim()).filter(Boolean).map((s)=>sql.query(s)));
await sql.query("INSERT INTO app_settings (id,data) VALUES (true,$1::jsonb) ON CONFLICT(id) DO NOTHING",[JSON.stringify(DEFAULT_SETTINGS)]);
console.log("Esquema Hablemos30min verificado. Reservas inicialmente pausadas.");
