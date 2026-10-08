import { requireAdmin } from '@/lib/auth';
import { settingsSchema } from '@/lib/validation';
import { saveSettings } from '@/lib/repository';
import { json,handleError,checkOrigin,readBody } from '@/lib/http';
export async function PATCH(request:Request){try{checkOrigin(request);await requireAdmin();const body=await readBody(request);const settings=settingsSchema.parse(body.settings);await saveSettings(settings);return json({ok:true,settings});}catch(e){return handleError(e);}}
