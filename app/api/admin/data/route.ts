import { requireAdmin } from '@/lib/auth';
import { getSettings,listBookings,listNotifications,listAudit,listBlocks } from '@/lib/repository';
import { json,handleError } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(){try{await requireAdmin();const [settings,bookings,notifications,audit,blocks]=await Promise.all([getSettings(),listBookings(),listNotifications(),listAudit(),listBlocks()]);return json({settings,bookings,notifications,audit,blocks,health:{database:true,stripe:!!process.env.STRIPE_SECRET_KEY,email:!!process.env.SMTP_PASS,cron:!!process.env.CRON_SECRET}});}catch(e){return handleError(e);}}
