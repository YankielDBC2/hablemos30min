import fs from 'node:fs/promises';
const k=JSON.parse(await fs.readFile('.private/providers.json','utf8'));
const r=await fetch('https://api.godaddy.com/v1/domains/hablemos30min.online/records/A/@',{method:'PUT',headers:{Authorization:`sso-key ${k.godaddyKey}:${k.godaddySecret}`,'Content-Type':'application/json'},body:JSON.stringify([{data:'76.76.21.21',ttl:600}])});
console.log('A @ Vercel',r.status);if(!r.ok)throw new Error('DNS failed');
