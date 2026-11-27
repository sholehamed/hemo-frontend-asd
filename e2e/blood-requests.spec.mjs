import {test,expect} from '@playwright/test';
const admissionGuid='11110000-1111-4111-8111-000000000001',requestGuid='22220000-1111-4111-8111-000000000002';
const patient={guid:admissionGuid,patientGuid:admissionGuid,firstName:'بیمار',lastName:'آزمون',hisNumber:'ST03-001',ward:'بخش آزمون',bedNumber:'1',identificationNumber:'UNK-TEST',birthDate:null,bloodGroup:null,identityStatus:'Verified',status:'Active',diagnosis:'تشخیص آزمایشی',transfusionHistory:'Unknown',alloantibody:false,allergy:false};
const allCaps={list:true,detail:true,stats:true,nurseCreate:false,doctorCreate:false,edit:true,submit:true,cancel:true,decide:false,bankQueue:false,bankDetail:false};
const admissionCaps={stats:false,list:true,detail:true,find:false,history:false,reviews:false,create:false,update:false,review:false,identity:false};
test('nurse submits, doctor returns and approves, bank sees approved request only',async({page})=>{
 let role='nurse',request=null,history=[],version=0;
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'fixture-token',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 page.on('dialog',dialog=>dialog.accept());
 const caps=()=>role==='bank'?Object.fromEntries(Object.keys(allCaps).map(k=>[k,['bankQueue','bankDetail'].includes(k)])):{...allCaps,nurseCreate:role==='nurse',doctorCreate:role==='doctor',decide:role==='doctor'};
 const row=()=>({...request.request,owned:role==='nurse'});
 const detail=()=>({...request,request:row(),history,version:String(version)});
 const pageData=rows=>({data:rows,pageNumber:1,totalCount:rows.length,totalPages:1,hasPreviousPage:false,hasNextPage:false});
 await page.route('**/Identity/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,method=req.method(),body=req.postDataJSON()??{};
  const ok=(data,status=200)=>route.fulfill({status,json:data});
  if(path.endsWith('/GetCurrentUserRoles'))return ok([{name:role,gkey:1,orgLocationName:'آزمون',organizationName:'آزمون'}]);
  if(path==='/Identity/PatientAdmission/Capabilities')return ok(role==='bank'?Object.fromEntries(Object.keys(admissionCaps).map(k=>[k,false])):admissionCaps);
  if(path==='/Identity/PatientAdmission/BindPaging')return ok(pageData([patient]));
  if(path==='/Identity/PatientAdmission/'+admissionGuid)return ok(patient);
  if(path==='/Identity/BloodRequest/Capabilities')return ok(caps());
  if(path.endsWith('/BloodRequest/Stats'))return ok({total:request?1:0,draft:request?.request.status==='Draft'?1:0,awaitingDoctor:request?.request.status==='AwaitingDoctor'?1:0,returned:request?.request.status==='Returned'?1:0,awaitingBank:request?.request.status==='AwaitingBank'?1:0,rejected:0,cancelled:0});
  if(path.endsWith('/BloodRequest/BindPaging'))return ok(pageData(request&&(!body.status||request.request.status===body.status)?[row()]:[]));
  if(path.endsWith('/BankQueue'))return ok(pageData(request?.request.status==='AwaitingBank'?[row()]:[]));
  if(path.endsWith('/BloodRequest/Nurse')&&method==='POST'){expect(role).toBe('nurse');expect(body.patientAdmissionGuid).toBe(admissionGuid);expect(body.formType).toBe('RBC');request={request:{guid:requestGuid,requestNumber:'BR-FIXTURE',patientAdmissionGuid:admissionGuid,patientName:'بیمار آزمون',hisNumber:'ST03-001',ward:'بخش آزمون',source:'Nurse',formType:body.formType,priority:body.priority,status:'Draft',created:'2026-11-27T12:00:00Z',submittedAt:null,totalUnits:body.items.reduce((n,x)=>n+x.quantity,0)},clientRequestId:body.clientRequestId,bloodGroup:null,identityStatus:'Verified',bedNumber:'1',items:body.items,clinical:body.clinical,admissionChanged:false};version++;return ok(requestGuid,201);}
  if(path==='/Identity/BloodRequest'&&method==='PUT'){expect(role).toBe('nurse');expect(body.version).toBe(String(version));request.clinical=body.input.clinical;request.items=body.input.items;version++;return route.fulfill({status:204});}
  if(path.endsWith('/Submit')||path.endsWith('/Decide')){expect(body.version).toBe(String(version));const prev=request.request.status;const next={Submit:'AwaitingDoctor',Return:'Returned',Approve:'AwaitingBank'}[body.action];expect(next).toBeTruthy();if(body.action==='Approve'){expect(role).toBe('doctor');expect(body.physician.confirmed).toBe(true);}request.request.status=next;request.request.submittedAt='2026-11-27T12:00:00Z';history.push({action:body.action,previousStatus:prev,newStatus:next,reason:body.reason??null,submissionAttempt:1,occurredAt:'2026-11-27T12:00:00Z',actorUserGuid:admissionGuid,actorRoleGuid:admissionGuid,physician:body.physician??null});version++;return route.fulfill({status:204});}
  if(path.endsWith('/'+requestGuid)&&request)return ok(detail());
  return ok({detail:'Unexpected path '+path},404);
 });
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('/hemo/requests/new');
 await expect(page).toHaveURL(/\/hemo\/requests\/new$/);
 try{await expect(page.getByRole('heading',{name:'انتخاب پرونده بیمار'})).toBeVisible({timeout:10000});}
 catch(e){console.log('ST03 deep-link diagnostic',page.url(),await page.locator('body').innerText(),pageErrors);throw e;}
 await page.getByRole('button',{name:'پذیرش‌های اخیر'}).click();
 await page.getByRole('button',{name:'بررسی پرونده'}).click();
 await expect(page.getByRole('heading',{name:'بیمار آزمون'})).toBeVisible();
 await page.getByRole('button',{name:'گلبول قرمز Hb، Hct و علت بالینی'}).click();
 await page.getByRole('button',{name:'مرحله بعد'}).click();
 await page.getByLabel('علت بالینی درخواست *',{exact:true}).fill('علت آزمایشی');
 await page.getByRole('button',{name:'مرحله بعد'}).click();
 await page.getByRole('button',{name:'ثبت و ارسال برای پزشک'}).click();
 await expect(page.getByText('درخواست برای پزشک ارسال شد.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'تأیید و ارسال به بانک خون'})).toHaveCount(0);
 role='bank';await page.goto('/');await expect(page).toHaveURL(/\/hemo\/requests\/bank$/);await expect(page.getByText('درخواستی مطابق فیلتر یافت نشد.')).toBeVisible();
 role='doctor';await page.goto('/hemo/requests/approval');await page.getByRole('link',{name:'بررسی و تصمیم'}).click();
 await page.getByLabel('دلیل / توضیحات (رد، برگشت و لغو الزامی)',{exact:true}).fill('نیاز به اصلاح');
 await page.getByRole('button',{name:'برگشت برای اصلاح'}).click();
 await expect(page.getByText('عملیات ثبت شد: برگشت برای اصلاح')).toBeVisible();
 role='nurse';await page.goto('/hemo/requests/detail/'+requestGuid);
 await page.getByRole('link',{name:'ویرایش درخواست'}).click();
 await page.getByLabel('علت بالینی درخواست *',{exact:true}).fill('اصلاح شده');
 await page.getByRole('button',{name:'مرحله بعد'}).click();await page.getByRole('button',{name:'ثبت و ارسال برای پزشک'}).click();
 await expect(page.getByText('درخواست برای پزشک ارسال شد.',{exact:true})).toBeVisible();
 role='doctor';await page.goto('/hemo/requests/approval');await page.getByRole('link',{name:'بررسی و تصمیم'}).click();
 await expect(page.getByRole('button',{name:'تأیید و ارسال به بانک خون'})).toBeDisabled();
 await page.getByLabel('شماره نظام پزشکی *',{exact:true}).fill('FIX-01');
 await page.getByRole('checkbox',{name:'اطلاعات درخواست و نظر ثبت‌شده را بررسی و مسئولیت این تصمیم را تأیید می‌کنم.'}).check();
 await page.getByRole('button',{name:'تأیید و ارسال به بانک خون'}).click();
 await expect(page.getByText('عملیات ثبت شد: تأیید پزشک')).toBeVisible();
 role='bank';await page.goto('/hemo/requests/bank');await page.getByRole('link',{name:'جزئیات',exact:true}).click();
 await expect(page.getByText('BR-FIXTURE',{exact:true})).toBeVisible();await expect(page.getByText('شماره نظام پزشکی: FIX-01',{exact:false})).toBeVisible();
 await expect(page.getByRole('button',{name:'تأیید و ارسال به بانک خون'})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'ثبت درخواست پرستاری',exact:true})).toHaveCount(0);
});
