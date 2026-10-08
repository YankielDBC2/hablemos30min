import fs from 'node:fs/promises';
import { randomBytes,scryptSync } from 'node:crypto';
const keys=JSON.parse(await fs.readFile('.private/providers.json','utf8'));
const domain='hablemos30min.online';
async function api(name,url,method,body,headers){const r=await fetch(url,{method,headers:{'Content-Type':'application/json',...headers},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();const d=text?JSON.parse(text):{};await fs.writeFile(`.private/${name}.json`,JSON.stringify(d,null,2));console.log(name,r.status,d.code||d.error?.code||'');if(!r.ok||d.error)throw new Error(name+' failed');return d;}
const nh={Authorization:`Bearer ${keys.neon}`};
const vh={Authorization:`Bearer ${keys.vercel}`};
const ph={'Purelymail-Api-Token':keys.purelymail};
const gh={Authorization:`sso-key ${keys.godaddyKey}:${keys.godaddySecret}`};
const user=JSON.parse(await fs.readFile('.private/vercel-inspect.json','utf8')).user;
const scope='team_ETqW09ANuH1YTO87rC7KdMWi';
const existing=await api('vercel-projects',`https://api.vercel.com/v9/projects?teamId=${scope}`,'GET',null,vh);
let project=existing.projects?.find(p=>p.name==='hablemos30min');
try{
if(!project)project=await api('vercel-project-create',`https://api.vercel.com/v11/projects?teamId=${scope}`,'POST',{name:'hablemos30min',framework:'nextjs',buildCommand:'npm run build',installCommand:'npm ci'},vh);
await fs.writeFile('.private/vercel-project.json',JSON.stringify({id:project.id,name:project.name,teamId:scope}));
}catch{console.log('Vercel provision pending access');}
const neonExisting=await api('neon-projects-current','https://console.neon.tech/api/v2/projects','GET',null,nh);
let neonProject=neonExisting.projects.find(p=>p.name==='Hablemos30min');
if(!neonProject){const org=neonExisting.projects[0]?.org_id;const n=await api('neon-create','https://console.neon.tech/api/v2/projects','POST',{project:{name:'Hablemos30min',region_id:'aws-us-east-1',pg_version:17,...(org?{org_id:org}:{}),default_endpoint_settings:{autoscaling_limit_min_cu:0.25,autoscaling_limit_max_cu:1,suspend_timeout_seconds:300}}},nh);neonProject=n.project;await fs.writeFile('.private/neon-project.json',JSON.stringify(n));}
const ownership=await api('pm-ownership','https://purelymail.com/api/v0/getOwnershipCode','POST',{},ph);
await api('dns-ownership',`https://api.godaddy.com/v1/domains/${domain}/records/TXT/@`,'PUT',[{data:ownership.result.code,ttl:600},{data:'v=spf1 include:_spf.purelymail.com ~all',ttl:600}],gh);
await api('dns-mx',`https://api.godaddy.com/v1/domains/${domain}/records/MX/@`,'PUT',[{data:'mailserver.purelymail.com',priority:50,ttl:600}],gh);
for(const [i,selector] of ['purelymail1','purelymail2','purelymail3'].entries())await api(`dns-${selector}`,`https://api.godaddy.com/v1/domains/${domain}/records/CNAME/${selector}._domainkey`,'PUT',[{data:`key${i+1}.dkimroot.purelymail.com`,ttl:600}],gh);
const credentials={password:randomBytes(24).toString('base64url'),salt:randomBytes(16).toString('hex'),sessionSecret:randomBytes(32).toString('hex'),cronSecret:randomBytes(32).toString('hex'),mailPassword:randomBytes(32).toString('base64url')};
try{await fs.access('.private/generated.json');}catch{await fs.writeFile('.private/generated.json',JSON.stringify(credentials));}
console.log('Resource provision stage completed');
