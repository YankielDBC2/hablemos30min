import { createCheckout } from '@/lib/services';
import { checkoutSchema } from '@/lib/validation';
import { json,handleError,checkOrigin,readBody,clientIp } from '@/lib/http';
export async function POST(request:Request){try{checkOrigin(request);return json(await createCheckout(checkoutSchema.parse(await readBody(request)),clientIp(request)));}catch(e){return handleError(e);}}
