import {test,expect} from '@playwright/test';
const base={total:10,active:8,verified:6,mismatch:2,ready:2,wards:[],bloodGroups:[]};
const requestStats={total:7,draft:1,awaitingDoctor:3,returned:1,awaitingBank:2,rejected:0,cancelled:0};
const transferStats={total:5,dispatched:1,received:0,receiptHold:1,verified:2,witnessed:0,inProgress:1,completed:0,stopped:0,returning:0,returned:0,disposed:0,suspectedReactions:0};
async function setup(page,role,caps,responses){
 const calls=[];
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'fixture',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 await page.route('**/Identity/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON()??{};
  const json=(v,status=200)=>route.fulfill({status,json:v});
  if(path.endsWith('/GetCurrentUserRoles'))return json([{name:role,gkey:1,orgLocationName:'مرکز آزمون',organizationName:'آزمون'}]);
  const parts=path.split('/'),module=parts[2],action=parts[3];if(action==='Capabilities')return json(caps[module]??{});
  calls.push({module,action,body});
  const response=responses[module+'/'+action];if(response)return json(typeof response==='function'?response(body):response);
  return json({detail:'fixture missing'},403);
 });
 return calls;
}
test('ST09 nurse desk uses own requests, filters drill-down and never calls unauthorized stats',async({page})=>{
 const calls=await setup(page,'پرستار آزمون',{BloodRequest:{stats:true,list:true,nurseCreate:true},Transfusion:{stats:true,list:true,receive:true,witness:true,vital:true}},{
  'BloodRequest/Stats':requestStats,'Transfusion/Stats':transferStats,'BloodRequest/BindPaging':{data:[],pageNumber:1,totalCount:0,totalPages:0,hasNextPage:false,hasPreviousPage:false}
 });
 await page.goto('/home');await expect(page.getByRole('heading',{name:'داشبورد نقش سازمانی'})).toBeVisible();
 await expect(page.getByRole('heading',{name:'درخواست‌های ثبت‌شده توسط من'})).toBeVisible();
 await expect(page.locator('[data-module="transfer"]')).toBeVisible();
 await expect(page.locator('[data-module="bank"]')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'ثبت دستور پزشک',exact:true})).toHaveCount(0);
 expect(calls.some(x=>x.module==='BloodRequest'&&x.action==='Stats'&&x.body.mine===true)).toBeTruthy();
 expect(calls.some(x=>x.module==='BloodBank'&&x.action==='Stats')).toBeFalsy();
 await page.getByRole('link',{name:'در انتظار پزشک؛ مشاهده رکوردها'}).click();
 await expect(page).toHaveURL(/hemo\/requests\?status=AwaitingDoctor&mine=true/);
 await expect.poll(()=>calls.some(x=>x.action==='BindPaging'&&x.body.status==='AwaitingDoctor'&&x.body.mine===true)).toBeTruthy();
});
test('ST09 aggregate manager sees only authorized summaries; failed source is not zero; compare periods',async({page})=>{
 const calls=await setup(page,'مدیر آمار',{PatientAdmission:{stats:true},BloodRequest:{stats:true},HemoQuality:{permissions:{equipmentStats:true}}},{
  'PatientAdmission/Stats':body=>({...base,total:body.from?4:10}),
  'BloodRequest/Stats':requestStats
 });
 await page.goto('/home');await expect(page.locator('[data-module="admission"]')).toBeVisible();
 await expect(page.locator('[data-module="requests"]')).toBeVisible();
 await expect(page.locator('[data-module="equipment"]').getByRole('alert')).toBeVisible();
 await expect(page.locator('[data-module="equipment"] .dashboard-metric')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'پذیرش جدید',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'بستری فعال؛ مشاهده رکوردها'})).toHaveCount(0);
 await page.getByRole('button',{name:'دریافت مقایسه'}).click();
 await expect(page.locator('.trend-row')).toHaveCount(1);
 expect(calls.filter(x=>x.module==='PatientAdmission'&&x.action==='Stats'&&x.body.from)).toHaveLength(2);
 expect(calls.some(x=>x.action==='BindPaging')).toBeFalsy();
});
