import type { AppSettings } from "./validation";
import { DURATION_MINUTES } from "./validation";

const formatters=new Map<string,Intl.DateTimeFormat>();
export function zonedParts(date: Date, timezone: string) {
  let formatter=formatters.get(timezone);
  if(!formatter) {formatter=new Intl.DateTimeFormat("en-CA", {timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});if(formatters.size<100) formatters.set(timezone,formatter);}
  const parts = formatter.formatToParts(date);
  const get = (key:string) => Number(parts.find((part)=>part.type===key)?.value);
  return {year:get("year"),month:get("month"),day:get("day"),hour:get("hour"),minute:get("minute")};
}
export function localToUtc(year:number,month:number,day:number,hour:number,minute:number,timezone:string): Date | null {
  const desired = Date.UTC(year,month-1,day,hour,minute);
  let result = desired;
  for(let i=0;i<4;i++) {
    const p=zonedParts(new Date(result),timezone);
    const actual=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute);
    if(actual===desired) return new Date(result);
    result+=desired-actual;
  }
  return null;
}
export function dayKey(date:Date,timezone:string) {
  const p=zonedParts(date,timezone);
  return `${p.year}-${String(p.month).padStart(2,"0")}-${String(p.day).padStart(2,"0")}`;
}
export function isBookableStart(start:Date,settings:AppSettings,now=new Date()):boolean {
  if(!Number.isFinite(start.getTime()) || start.getSeconds()!==0 || start.getMilliseconds()!==0) return false;
  if(start.getTime()<now.getTime()+settings.minNoticeHours*3600000 || start.getTime()>now.getTime()+settings.horizonDays*86400000) return false;
  const p=zonedParts(start,settings.timezone);
  const resolved=localToUtc(p.year,p.month,p.day,p.hour,p.minute,settings.timezone);
  if(!resolved || resolved.getTime()!==start.getTime()) return false;
  const day=new Date(Date.UTC(p.year,p.month-1,p.day)).getUTCDay();
  const hours=settings.weeklyHours.find((v)=>v.day===day);
  if(!hours?.enabled) return false;
  const asMinutes=(time:string)=>Number(time.slice(0,2))*60+Number(time.slice(3));
  const current=p.hour*60+p.minute, begins=asMinutes(hours.start), ends=asMinutes(hours.end);
  return current>=begins && current+DURATION_MINUTES<=ends && (current-begins)%(DURATION_MINUTES+settings.bufferMinutes)===0;
}
export function generateSlots(month:string,viewerTimezone:string,settings:AppSettings,now=new Date()):string[] {
  const [year,monthNumber]=month.split("-").map(Number);
  const result:string[]=[];
  const lower=Date.UTC(year,monthNumber-1,1)-2*86400000;
  const upper=Date.UTC(year,monthNumber,1)+2*86400000;
  // Generate only configured local slots, then resolve each to a real UTC instant.
  // A nonexistent DST time is skipped and ambiguous clock times appear once.
  for(let dayInstant=lower;dayInstant<upper;dayInstant+=86400000) {
    const calendar=new Date(dayInstant),hours=settings.weeklyHours.find((v)=>v.day===calendar.getUTCDay());
    if(!hours?.enabled) continue;
    const minutes=(value:string)=>Number(value.slice(0,2))*60+Number(value.slice(3));
    for(let minute=minutes(hours.start);minute+DURATION_MINUTES<=minutes(hours.end);minute+=DURATION_MINUTES+settings.bufferMinutes) {
      const date=localToUtc(calendar.getUTCFullYear(),calendar.getUTCMonth()+1,calendar.getUTCDate(),Math.floor(minute/60),minute%60,settings.timezone);
      if(date && dayKey(date,viewerTimezone).startsWith(month) && isBookableStart(date,settings,now)) result.push(date.toISOString());
    }
  }
  return result.sort();
}
export function overlaps(start:string,end:string,blockedStart:string,blockedEnd:string) {
  return Date.parse(start)<Date.parse(blockedEnd) && Date.parse(end)>Date.parse(blockedStart);
}
