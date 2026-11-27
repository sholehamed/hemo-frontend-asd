import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all eight Raw admission routes plus detail are lazy guarded routes',()=>{
 const routes=read('src/app/app.routes.ts');
 for(const p of ['admission','admission/new','admission/list','admission/detail/:guid','admission/identity','admission/history','admission/discharge','admission/his','admission/stats']){
  assert.match(routes,new RegExp("path:'"+p.replace(':','\\:')+"'[^\\n]*canActivate:\\[authGuard\\]"));
 }
});
test('service contract contains all operations on current Identity host',()=>{
 const service=read('src/app/core/api/admissions.service.ts');
 for(const p of ['/Identity/PatientAdmission','/BindPaging','/FindPatient','/PatientIdentity','/History','/Reviews','/Stats','/Review'])assert.ok(service.includes(p),p);
 assert.ok(service.includes('this.http.put<void>'));
});
test('shared real components are reused and HIS cannot pretend to send',()=>{
 const dashboard=read('src/app/features/admission/admission-dashboard.component.ts');
 assert.match(dashboard,/<app-admission-create/);
 assert.match(dashboard,/<app-admission-table/);
 assert.match(dashboard,/<app-admission-metrics/);
 const review=read('src/app/features/admission/admission-review.component.html');
 assert.match(review,/<app-admission-picker/);
 assert.match(review,/save\('Verified'\)/);
 assert.match(review,/save\('Reviewed'\)/);
 assert.match(review,/save\('Ready'\)/);
 const his=read('src/app/features/admission/admission-his.component.ts');
 assert.match(his,/button mat-flat-button disabled>اجرای همگام‌سازی/);
});
test('JWT and role headers use existing contract, only sent to same-origin Identity path',()=>{
 const source=read('src/app/core/auth/identity.interceptor.ts');
 assert.match(source,/startsWith\('\/Identity\/'\)/);
 assert.match(source,/Authorization:'Bearer '/);
 assert.match(source,/UserRole:String\(token.userRole\)/);
});
