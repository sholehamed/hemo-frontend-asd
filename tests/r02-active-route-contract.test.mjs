import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('R02 active 62 routes match the verified backend seed menu contract',()=>{
 const files=['admission-pilot','request-read','bank-read','transfer-read','hv-read','quality-read','dashboard'];
 const active=files.flatMap(name=>[...read('src/app/core/hemo/hemo-'+name+'.routes.ts').matchAll(/\bpath:\s*'([^']+)'/g)].map(m=>'/'+m[1]));
 const contract=JSON.parse(read('docs/delivery/r02-active-route-contract.json'));
 assert.equal(contract.version,'R02');assert.equal(active.length,62);assert.equal(new Set(active).size,62);
 assert.deepEqual(active.sort(),contract.paths);
 const root=read('src/app.routes.ts');
 for(const name of ['hemoAdmissionPilotRoutes','hemoRequestReadRoutes','hemoBankReadRoutes','hemoTransferReadRoutes','hemoHvReadRoutes','hemoQualityReadRoutes','hemoDashboardRoutes'])assert.ok(root.includes('...'+name),name);
 assert.match(root,/path:\s*'',\s*component:\s*Dashboard,\s*canActivate:\s*\[authGuardGuard\]/);
});
