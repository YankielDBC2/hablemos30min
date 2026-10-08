import fs from 'node:fs/promises';
const keys=JSON.parse(await fs.readFile('.private/providers.json','utf8'));
const checks=[
 ['vercel','https://api.vercel.com/v2/user',{Authorization:`Bearer ${keys.vercel}`}],
 ['teams','https://api.vercel.com/v2/teams',{Authorization:`Bearer ${keys.vercel}`}],
 ['neon','https://console.neon.tech/api/v2/projects',{Authorization:`Bearer ${keys.neon}`}],
 ['godaddy','https://api.godaddy.com/v1/domains/hablemos30min.online/records',{Authorization:`sso-key ${keys.godaddyKey}:${keys.godaddySecret}`}],
 ['stripe','https://api.stripe.com/v1/account',{Authorization:`Bearer ${keys.stripe}`}]
];
for(const [name,url,headers] of checks){
 try{ const r=await fetch(url,{headers}); const data=await r.json(); await fs.writeFile(`.private/${name}-inspect.json`,JSON.stringify(data,null,2));
 console.log(name,JSON.stringify({status:r.status,id:data.id,username:data.user?.username,teams:data.teams?.map(t=>({id:t.id,slug:t.slug,name:t.name})),projects:data.projects?.map(p=>({id:p.id,name:p.name})),records:Array.isArray(data)?data.map(x=>({type:x.type,name:x.name,data:x.data})):undefined,charges_enabled:data.charges_enabled,payouts_enabled:data.payouts_enabled,code:data.code}));
 }catch{console.log(name,'Error de conexión');}
}
const spec=await fetch('https://news.purelymail.com/api/swagger-spec.js').then(r=>r.text()); await fs.writeFile('.private/purelymail-spec.js',spec); console.log('Purelymail spec saved',spec.length);
