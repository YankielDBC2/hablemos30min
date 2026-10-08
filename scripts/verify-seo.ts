import assert from 'node:assert/strict';
import { SITE_URL } from '../lib/seo';
import { PRICE_CENTS, DURATION_MINUTES } from '../lib/validation';

const origin = process.argv[2] || SITE_URL;
assert.match(origin, /^https?:\/\//, 'Indica un origen HTTP o HTTPS');

function attributes(tag: string): Record<string, string> {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [match[1].toLowerCase(), match[2].replace(/&amp;/g, '&').replace(/&quot;/g, '"')]));
}
function meta(head: string, key: string): string {
  for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
    const values = attributes(tag);
    if (values.name === key || values.property === key) return values.content || '';
  }
  return '';
}
async function resource(path: string) {
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, `${path} debe devolver 200`);
  return response;
}

const publicPaths = ['/', '/terminos', '/privacidad'];
const titles = new Set<string>(), descriptions = new Set<string>();
let homepage = '';
for (const path of [...publicPaths, '/admin', '/confirmacion']) {
  const html = await (await resource(path)).text();
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, `${path}: metadatos presentes en head`);
  const canonical = (head.match(/<link\b[^>]*>/gi) || []).map(attributes).find((tag) => tag.rel === 'canonical')?.href;
  assert.ok(canonical, `${path}: canonical presente`);
  // Next normalizes the root canonical without its trailing slash; both identify the same URL.
  assert.equal(new URL(canonical).toString(), new URL(path, SITE_URL).toString(), `${path}: canonical propio del dominio público`);
  const links = (head.match(/<link\b[^>]*>/gi) || []).map(attributes);
  assert.ok(links.some((tag) => tag.rel === 'icon' && tag.href === '/favicon-96.png'));
  assert.ok(links.some((tag) => tag.rel === 'apple-touch-icon' && tag.href === '/apple-touch-icon.png'));
  assert.ok(links.some((tag) => tag.rel === 'manifest' && tag.href?.startsWith('/manifest.webmanifest')));
  if (publicPaths.includes(path)) {
    const title = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '';
    const description = meta(head, 'description');
    assert.ok(title && description, `${path}: título y descripción presentes`);
    assert.ok(title.includes('Hablemos30min'), `${path}: título con marca`);
    assert.ok(!titles.has(title) && !descriptions.has(description), `${path}: metadatos únicos`);
    titles.add(title); descriptions.add(description);
    assert.ok(!meta(head, 'robots').includes('noindex'), `${path}: página indexable`);
    assert.equal(new URL(meta(head, 'og:url')).toString(), new URL(canonical).toString(), `${path}: URL social propia`);
    assert.ok(meta(head, 'og:title') && meta(head, 'og:description'), `${path}: contenido social propio`);
    assert.equal(meta(head, 'og:image'), `${SITE_URL}/og-hablemos30min.png`);
    assert.equal(meta(head, 'twitter:card'), 'summary_large_image');
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${path}: un encabezado principal`);
  } else {
    assert.match(meta(head, 'robots'), /noindex/);
    assert.match(meta(head, 'robots'), /nofollow/);
    assert.match(meta(head, 'robots'), /nosnippet/);
  }
  if (path === '/') homepage = html;
  console.log(`OK ${path}: metadata, canonical e indexación`);
}

const jsonLd = [...homepage.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]));
assert.equal(jsonLd.length, 1, 'Un grafo estructurado de la portada');
const graph = jsonLd[0]['@graph'] as Array<Record<string, unknown>>;
assert.ok(graph.some((entry) => entry['@type'] === 'WebSite' && entry.inLanguage === 'es'));
const service = graph.find((entry) => entry['@type'] === 'Service');
assert.ok(service, 'Servicio real descrito');
assert.match(String(service.name), new RegExp(String(DURATION_MINUTES)));
const offer = service.offers as {price:string;priceCurrency:string};
assert.equal(Number(offer.price) * 100, PRICE_CENTS);
assert.equal(offer.priceCurrency, 'USD');
assert.ok(!JSON.stringify(graph).includes('aggregateRating'), 'Sin calificaciones inventadas');

const sitemap = await (await resource('/sitemap.xml')).text();
assert.deepEqual([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort(), publicPaths.map((path) => new URL(path, SITE_URL).toString()).sort());
const robots = await (await resource('/robots.txt')).text();
assert.match(robots, /Disallow:\s*\/api\//);
assert.ok(!/Disallow:\s*\/(admin|confirmacion)/.test(robots), 'Noindex debe poder leerse mediante rastreo');
assert.ok(robots.includes(`${SITE_URL}/sitemap.xml`));
const llmsResponse = await resource('/llms.txt');
assert.match(llmsResponse.headers.get('content-type') || '', /text\/plain/);
const llms = await llmsResponse.text();
assert.equal(llms, await (await resource('/llm.txt')).text(), 'Alias LLM con contenido idéntico');
assert.match(llms, /49 USD/);
assert.match(llms, /30 minutos/);
const imageResponse = await resource('/og-hablemos30min.png');
assert.match(imageResponse.headers.get('content-type') || '', /image\/png/);
const image = Buffer.from(await imageResponse.arrayBuffer());
assert.equal(image.subarray(1, 4).toString(), 'PNG');
assert.equal(image.readUInt32BE(16), 1200);
assert.equal(image.readUInt32BE(20), 630);
console.log('OK JSON-LD, sitemap, robots, LLM y Open Graph 1200 × 630');
for (const [path, size] of [['/favicon-96.png', 96], ['/apple-touch-icon.png', 180], ['/icon-192.png', 192], ['/icon-512.png', 512]] as const) {
  const iconResponse = await resource(path);
  assert.match(iconResponse.headers.get('content-type') || '', /image\/png/);
  const icon = Buffer.from(await iconResponse.arrayBuffer());
  assert.equal(icon.readUInt32BE(16), size);
  assert.equal(icon.readUInt32BE(20), size);
}
await resource('/favicon.ico');
const manifest = await (await resource('/manifest.webmanifest')).json() as {name:string;lang:string;start_url:string;icons:Array<{src:string;sizes:string}>};
assert.equal(manifest.name, 'Hablemos30min');
assert.equal(manifest.lang, 'es');
assert.equal(manifest.start_url, '/');
assert.ok(manifest.icons.some((icon) => icon.src === '/icon-192.png' && icon.sizes === '192x192'));
assert.ok(manifest.icons.some((icon) => icon.src === '/icon-512.png' && icon.sizes === '512x512'));
console.log('OK favicon, iconos Apple/app y manifest en español');
