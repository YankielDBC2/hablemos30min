import fs from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
const keys=JSON.parse(await fs.readFile('.private/providers.json','utf8'));
let data;try{data=JSON.parse(await fs.readFile('.private/business.json','utf8'));}catch{data={email:'business@hablemos30min.online',password:randomBytes(28).toString('base64url')};await fs.writeFile('.private/business.json',JSON.stringify(data));}
const headers={'Purelymail-Api-Token':keys.purelymail,'Content-Type':'application/json'};
const users=await fetch('https://purelymail.com/api/v0/listUser',{method:'POST',headers,body:'{}'}).then(r=>r.json());
if(!users.result?.users?.includes(data.email)){const r=await fetch('https://purelymail.com/api/v0/createUser',{method:'POST',headers,body:JSON.stringify({userName:'business',domainName:'hablemos30min.online',password:data.password,enablePasswordReset:false,enableSearchIndexing:true,sendWelcomeEmail:false})});const out=await r.json();console.log('business mailbox',r.status,out.error?.code||'created');if(!r.ok||out.error)throw new Error('Mailbox creation failed');}
const access=await fs.readFile('.private/ACCESOS.md','utf8');if(!access.includes('## Correo business'))await fs.appendFile('.private/ACCESOS.md',`\n## Correo business\nBuzón: ${data.email}\nWebmail: https://inbox.purelymail.com\nContraseña: ${data.password}\n`);
console.log('Private business access file ready');
