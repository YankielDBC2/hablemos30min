import fs from 'node:fs/promises';
const keys=JSON.parse(await fs.readFile('.private/providers.json','utf8'));
const headers={Authorization:`sso-key ${keys.godaddyKey}:${keys.godaddySecret}`,'Content-Type':'application/json'};
const base='https://api.godaddy.com/v1/domains/hablemos30min.online/records';
const records=await fetch(base,{headers}).then(r=>r.json());
await fs.writeFile('.private/dns-before-dmarc.json',JSON.stringify(records,null,2));
if(records.some(r=>r.type==='TXT'&&r.name==='_dmarc')){const d=await fetch(base+'/TXT/_dmarc',{method:'DELETE',headers});console.log('Remove previous DMARC template',d.status);if(!d.ok)throw new Error('DMARC update failed');}
const r=await fetch(base+'/CNAME/_dmarc',{method:'PUT',headers,body:JSON.stringify([{data:'dmarcroot.purelymail.com',ttl:600}])});console.log('Purelymail DMARC configured',r.status);if(!r.ok)throw new Error('DMARC write failed');
