import fs from 'node:fs/promises';
import dns from 'node:dns/promises';

const domain = 'hablemos30min.online';
const proof = 'google-site-verification=5CTDzQWELtMg6uhpVKEmr7lpqbSjYr0kM1L9po91OOo';
const keys = JSON.parse(await fs.readFile('.private/providers.json', 'utf8'));
const headers = { Authorization: `sso-key ${keys.godaddyKey}:${keys.godaddySecret}`, 'Content-Type': 'application/json' };
const endpoint = `https://api.godaddy.com/v1/domains/${domain}/records/TXT/@`;
const response = await fetch(endpoint, { headers });
if (!response.ok) throw new Error(`DNS read failed: ${response.status}`);
const before = await response.json();
await fs.writeFile('.private/dns-before-google-verification.json', JSON.stringify(before, null, 2));
if (!before.some(record => record.data === proof)) {
  const records = before.map(({ data, ttl }) => ({ data, ttl }));
  records.push({ data: proof, ttl: 600 });
  const result = await fetch(endpoint, { method: 'PUT', headers, body: JSON.stringify(records) });
  if (!result.ok) throw new Error(`DNS write failed: ${result.status}`);
  console.log('Google verification TXT added; existing TXT preserved');
}
dns.setServers(['1.1.1.1', '8.8.8.8']);
const current = await dns.resolveTxt(domain);
console.log('Google verification visible on public DNS:', current.some(record => record.join('') === proof));
