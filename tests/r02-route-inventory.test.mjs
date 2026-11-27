import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('R02 inventory covers every existing guarded HEMO route exactly once',()=>{
 const source=read('src/app/app.routes.ts');
 const old=[...source.matchAll(/\{path:'([^']+)'[^\n]*canActivate:\[authGuard\]/g)].map(x=>'/'+x[1]);
 const inventory=JSON.parse(read('docs/delivery/r02-route-inventory.json'));
 assert.equal(inventory.status,'inventory-only-not-a-permission-grant');
 assert.equal(inventory.routes.length,61);
 assert.deepEqual(inventory.routes.map(x=>x.path).sort(),old.sort());
 assert.equal(new Set(old).size,old.length);
 for(const row of inventory.routes) {
   assert.equal(row.guardMenu,row.path==='/home'?'/':row.path);
   assert.equal(row.parameterized,row.path.includes(':'));
 }
});
