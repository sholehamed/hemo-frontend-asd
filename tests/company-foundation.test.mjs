import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('R01 boots the original company application, not the independent HEMO shell',()=>{
  assert.match(read('src/main.ts'),/from '\.\/app\.config'/);
  assert.match(read('src/main.ts'),/from '\.\/app\.component'/);
  const c=read('src/app.config.ts');
  assert.match(c,/providePrimeNG/);
  assert.match(c,/withInterceptors\(\[AuthInterceptor\]\)/);
  assert.match(c,/MaterialPersianDateAdapter/);
});
test('R01 keeps the original Angular 19 lock and does not load jQuery scripts',()=>{
  const p=JSON.parse(read('package.json')),l=JSON.parse(read('package-lock.json')),a=JSON.parse(read('angular.json'));
  assert.deepEqual(p.dependencies,l.packages[''].dependencies);
  assert.deepEqual(p.devDependencies,l.packages[''].devDependencies);
  assert.equal(l.packages['node_modules/@angular/core'].version,'19.0.5');
  assert.equal(l.packages['node_modules/primeng'].version,'19.0.9');
  assert.equal(l.packages['node_modules/typescript'].version,'5.6.3');
  const opts=a.projects['sakai-ng'].architect.build.options;
  assert.ok(opts.polyfills.includes('zone.js'));
  assert.ok(opts.styles.includes('src/styles.scss'));
  assert.deepEqual(opts.scripts,[]);
  assert.ok(opts.assets.some(x=>x.input==='public'));
  assert.equal(p.dependencies.jquery,undefined);
  assert.equal(p.dependencies['jquery-captcha'],undefined);
});
