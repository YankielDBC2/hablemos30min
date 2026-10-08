import fs from 'node:fs/promises';
import {scryptSync} from 'node:crypto';
const keys=JSON.parse(await fs.readFile('.private/providers.json','utf8'));
const generated=JSON.parse(await fs.readFile('.private/generated.json','utf8'));
const neon=JSON.parse(await fs.readFile('.private/neon-project.json','utf8'));
const domain='hablemos30min.online',mail=`reservas@${domain}`;
async function api(name,body){const r=await fetch(`https://purelymail.com/api/v0/${name}`,{method:'POST',headers:{'Purelymail-Api-Token':keys.purelymail,'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();await fs.writeFile(`.private/pm-${name}.json`,JSON.stringify(d,null,2));console.log(name,r.status,d.error?.code||'');if(!r.ok||d.error)throw new Error(name+' failed');return d;}
const domains=await api('listDomains',{includeShared:false});
if(!domains.result.domains.some(d=>d.name===domain))await api('addDomain',{domainName:domain});
const users=await api('listUser',{});
if(!users.result.users.includes(mail))await api('createUser',{userName:'reservas',domainName:domain,password:generated.mailPassword,enablePasswordReset:false,enableSearchIndexing:true,sendWelcomeEmail:false});
let appPassword;
try{appPassword=JSON.parse(await fs.readFile('.private/mail-app-password.json','utf8')).appPassword;}catch{const result=await api('createAppPassword',{userHandle:mail,name:'Hablemos30min notificaciones'});appPassword=result.result.appPassword;await fs.writeFile('.private/mail-app-password.json',JSON.stringify({appPassword}));}
const url=new URL(neon.connection_uris[0].connection_uri);url.hostname=url.hostname.replace('.','-pooler.');
const env={APP_URL:'http://localhost:3100',DATABASE_URL:url.href,STRIPE_SECRET_KEY:keys.stripe,SMTP_HOST:'smtp.purelymail.com',SMTP_PORT:'465',SMTP_USER:mail,SMTP_PASS:appPassword,MAIL_FROM:mail,ADMIN_PASSWORD_HASH:`${generated.salt}:${scryptSync(generated.password,generated.salt,64).toString('hex')}`,ADMIN_SESSION_SECRET:generated.sessionSecret,CRON_SECRET:generated.cronSecret};
await fs.writeFile('.env.local',Object.entries(env).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join('\n')+'\n');
await fs.writeFile('.private/runtime-env.json',JSON.stringify(env,null,2));
await fs.writeFile('.private/ACCESOS.md',`# Accesos privados de Hablemos30min\n\n## Administración\nDirección: https://hablemos30min.online/admin\nContraseña: ${generated.password}\n\n## Correo\nBuzón: ${mail}\nWebmail: https://inbox.purelymail.com\nContraseña: ${generated.mailPassword}\n\nEste archivo es privado y está excluido de Git. No compartir ni publicar.\n`);
console.log('Local env and private access file created');
