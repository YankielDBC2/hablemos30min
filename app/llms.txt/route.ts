import { LLM_TEXT } from '@/lib/seo';

export const dynamic = 'force-static';

export function GET() {
  return new Response(LLM_TEXT, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
