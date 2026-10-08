import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from './auth';

export function json(data:unknown,status=200) { return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export function checkOrigin(request:Request) {
  const origin=request.headers.get('origin');
  const allowed=new URL(process.env.APP_URL || 'http://localhost:3100').origin;
  if (!origin || (origin!==allowed && !(process.env.NODE_ENV!=='production' && origin===new URL(request.url).origin))) throw new HttpError('Solicitud no permitida.',403);
}
export async function readBody(request:Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError('Envía datos JSON.',415);
  const text=await request.text(); if (text.length>20_000) throw new HttpError('La solicitud es demasiado grande.',413);
  try{return JSON.parse(text);}catch{throw new HttpError('Datos inválidos.');}
}
export function clientIp(request:Request) { return (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'local').split(',')[0].trim().slice(0,80); }
export function handleError(error:unknown) {
  if(error instanceof ZodError) return json({error:error.issues[0]?.message || 'Revisa los datos.'},400);
  if(error instanceof HttpError) return json({error:error.message},error.status);
  if(error instanceof Error && 'status' in error && typeof error.status==='number' && error.status>=400 && error.status<500) return json({error:error.message},error.status);
  console.error('Request failed',error instanceof Error ? error.constructor.name : 'Unknown');
  return json({error:'No pudimos completar la solicitud. Inténtalo de nuevo en unos minutos.'},503);
}
