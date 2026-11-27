import {test,expect} from '@playwright/test';
const guid='babe0000-1111-4111-8111-000000000001';
const newGuid='babe0000-1111-4111-8111-000000000002';
const patient={guid,patientGuid:'12340000-1111-4111-8111-000000000001',identificationType:'Unknown',identificationNumber:'UNK-TEST',firstName:'بیمار',lastName:'آزمایشی',fatherName:null,birthDate:null,gender:'Unknown',mobile:null,hisNumber:'TEST-001',ward:'بخش آزمون',bedNumber:'1',physician:'پزشک آزمون',admissionType:'Inpatient',diagnosis:null,insurance:null,bloodGroup:null,transfusionHistory:'Unknown',allergy:false,leukoreduced:false,irradiated:false,alloantibody:false,notes:null,admittedAt:'2026-11-27T12:00:00Z',identityStatus:'Pending',identityReviewedAt:null,wristbandCode:'HEMO-TEST-001',status:'Active',historyReviewedAt:null,clearanceChecklist:0,clearanceNotes:null,clearanceReviewedAt:null,version:'AAAAAAAAAAA='};
test.beforeEach(async({page})=>{
 let rows=[structuredClone(patient)],reviews=[];
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'browser-test-token-not-real',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 await page.route('**/Identity/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname,method=req.method(),body=req.postDataJSON()??{};
 const respond=(obj,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(obj)});
 if(path.endsWith('/GetCurrentUserRoles'))return respond([{name:'پذیرش آزمایشی',gkey:1,orgLocationName:'مرکز آزمون',organizationName:'سازمان'}]);
 if(path.endsWith('/Stats'))return respond({total:rows.length,active:rows.filter(a=>a.status==='Active').length,verified:rows.filter(a=>a.identityStatus==='Verified').length,mismatch:0,ready:rows.filter(a=>a.status==='ReadyForDischarge').length,wards:[{name:'بخش آزمون',count:rows.length}],bloodGroups:[{name:'Unknown',count:rows.length}]});
 if(path.endsWith('/BindPaging')){const data=body.search?rows.filter(a=>(a.firstName+' '+a.lastName+' '+a.hisNumber).includes(body.search)):rows;return respond({data,pageNumber:1,totalCount:data.length,totalPages:1,hasNextPage:false,hasPreviousPage:false});}
 if(path.endsWith('/FindPatient'))return respond(null);
 if(path.endsWith('/PatientAdmission')&&method==='POST'){rows.push({...patient,...body,guid:newGuid,patientGuid:newGuid,identificationNumber:'UNK-NEW',wristbandCode:'HEMO-TEST-002'});return respond(newGuid,201);}
 if(path.endsWith('/Review')&&method==='POST'){
  const row=rows.find(a=>a.guid===body.guid);if(!row)return respond({detail:'Not found'},400);
  if(body.kind==='Identity')row.identityStatus=body.outcome;
  if(body.kind==='History')row.historyReviewedAt='2026-11-27T13:00:00Z';
  if(body.kind==='Clearance'){row.clearanceChecklist=body.checklist;row.status=body.outcome==='Ready'?'ReadyForDischarge':'Active';}
  reviews.push({kind:body.kind,outcome:body.outcome,checklist:body.checklist,notes:body.notes,reviewedAt:'2026-11-27T13:00:00Z'});
  return route.fulfill({status:204});
 }
 if(path.endsWith('/Reviews'))return respond(reviews);
 if(path.endsWith('/History'))return respond(rows.filter(a=>a.guid===guid));
 const selected=rows.find(a=>path.endsWith('/'+a.guid));if(selected&&method==='GET')return respond(selected);
 return respond({detail:'Unexpected API in browser fixture: '+path},404);
 });
});
test('dashboard, real form flow against contract fixture and saved wristband',async({page})=>{
 await page.goto('/admission');await expect(page.getByRole('heading',{name:'داشبورد پذیرش بیمارستان'})).toBeVisible();
 await page.getByRole('link',{name:'پذیرش بیمار جدید',exact:true}).click();
 await page.locator('select[formcontrolname="identificationType"]').selectOption('Unknown');
 await page.locator('input[formcontrolname="firstName"]').fill('بیمار');
 await page.locator('input[formcontrolname="lastName"]').fill('آزمایشی جدید');
 await page.locator('input[formcontrolname="hisNumber"]').fill('TEST-002');
 await page.locator('input[formcontrolname="ward"]').fill('بخش آزمون');
 await page.locator('input[formcontrolname="bedNumber"]').fill('2');
 await page.locator('input[formcontrolname="physician"]').fill('پزشک آزمون');
 await page.getByRole('button',{name:'ثبت نهایی پرونده و پذیرش'}).click();
 await expect(page).toHaveURL(new RegExp('/admission/detail/'+newGuid));
 await expect(page.getByText('HEMO-TEST-002',{exact:true})).toBeVisible();
 await expect(page.locator('app-wristband svg rect').first()).toBeVisible();
 await page.goto('/admission/list');await expect(page.getByText('آزمایشی جدید',{exact:false}).first()).toBeVisible();
});
test('identity, history, clearance, stats and unconfigured external integrations',async({page})=>{
 await page.goto('/admission/identity?guid='+guid);
 await expect(page.getByRole('button',{name:'ثبت تأیید نهایی تطبیق هویت'})).toBeDisabled();
 for(const box of await page.locator('.checklist input[type=checkbox]').all())await box.check();
 await page.getByRole('button',{name:'ثبت تأیید نهایی تطبیق هویت'}).click();
 await expect(page.getByText('بررسی در پرونده ذخیره شد.')).toBeVisible();
 await page.goto('/admission/history?guid='+guid);
 await expect(page.getByText('سوابق ثبت‌شده در همین مرکز')).toBeVisible();
 await page.locator('textarea').fill('بررسی مستند در محیط آزمون');
 await page.getByRole('button',{name:'ثبت تأییدیه بررسی سوابق'}).click();
 await expect(page.getByText('بررسی در پرونده ذخیره شد.')).toBeVisible();
 await page.goto('/admission/discharge?guid='+guid);
 for(const box of await page.locator('.checklist input[type=checkbox]').all())await box.check();
 await page.getByRole('button',{name:'ثبت بررسی و آماده‌سازی پرونده ترخیص'}).click();
 await expect(page.getByText('بررسی در پرونده ذخیره شد.')).toBeVisible();
 await page.goto('/admission/stats');await expect(page.getByRole('heading',{name:'توزیع پذیرش بر اساس بخش'})).toBeVisible();
 await page.goto('/admission/his');await expect(page.getByRole('button',{name:'اجرای همگام‌سازی'})).toBeDisabled();
 await expect(page.getByText('اتصال سرویس بیرونی تعریف نشده است',{exact:true})).toBeVisible();
});
