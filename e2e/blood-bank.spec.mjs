import {test,expect} from '@playwright/test';
const unitGuid='33330000-1111-4111-8111-000000000003',requestGuid='44440000-1111-4111-8111-000000000004',admissionGuid='55550000-1111-4111-8111-000000000005';
const bankCaps={inventory:true,unit:true,stats:true,temperatureHistory:true,receive:true,inspect:false,test:true,reserve:true,thaw:true,ready:true,hold:true,unreserve:true,discard:false,temperature:true,returnRequest:false};
const admissionCaps={stats:false,list:false,detail:false,find:false,history:false,reviews:false,create:false,update:false,review:false,identity:false};
const requestCaps={list:false,detail:false,stats:false,nurseCreate:false,doctorCreate:false,edit:false,submit:false,cancel:false,decide:false,bankQueue:true,bankDetail:true};
const clinical={diagnosis:'آزمون',clinicalIndication:'آزمون',hemoglobin:null,hematocrit:null,plateletCount:null,recentTransfusion:null,recentPregnancy:null,priorReaction:null,unexpectedAntibody:null,premedication:null,sampleStatus:'Unknown',notes:null,formDetails:{}};
const request={request:{guid:requestGuid,requestNumber:'BR-ST04-FIXTURE',patientAdmissionGuid:admissionGuid,patientName:'بیمار آزمون',hisNumber:'FIX04',ward:'آزمون',source:'Nurse',formType:'General',priority:'Routine',status:'AwaitingBank',created:'2026-11-27T12:00:00Z',submittedAt:'2026-11-27T12:00:00Z',totalUnits:1,owned:false},clientRequestId:admissionGuid,version:'req-v1',bloodGroup:null,identityStatus:'Verified',bedNumber:'1',items:[{productCode:'FFP',quantity:1,requestedBloodGroup:null,specialInstructions:null}],clinical,history:[],admissionChanged:false};
test('bank roles receive, inspect, record laboratory evidence, reserve, thaw, prepare and quarantine',async({page})=>{
 let role='operator',unit=null,events=[],tests=[],temps=[],version=0,returned=false;
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'fixture-token',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 page.on('dialog',d=>d.accept());
 const pageData=data=>({data,pageNumber:1,totalCount:data.length,totalPages:data.length?1:0,hasPreviousPage:false,hasNextPage:false});
 const caps=()=>role==='supervisor'?{...bankCaps,inspect:true,discard:true,returnRequest:true}:bankCaps;
 const log=(action,before,reason,extra={})=>events.unshift({action,previousStatus:before,newStatus:unit.status,requestGuid:unit.requestGuid,occurredAt:new Date().toISOString(),actorUserGuid:unitGuid,actorRoleGuid:unitGuid,reason,method:null,temperature:null,effectiveExpiry:null,...extra});
 const now=()=>new Date().toISOString();const expiry=new Date(Date.now()+2*86400000).toISOString();
 const localDate=(v)=>new Intl.DateTimeFormat('en-US-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(v)).filter(x=>['year','month','day'].includes(x.type)).reduce((a,x)=>({...a,[x.type]:x.value}),{});
 const dateInput=v=>{const x=localDate(v);return x.year+'/'+x.month+'/'+x.day;};
 const timeInput=v=>{const d=new Date(v);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');};
 await page.route('**/Identity/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON()??{};
  const ok=(json,status=200)=>route.fulfill({status,json});
  if(path.endsWith('/GetCurrentUserRoles'))return ok([{name:role,gkey:1,orgLocationName:'آزمون',organizationName:'آزمون'}]);
  if(path==='/Identity/PatientAdmission/Capabilities')return ok(admissionCaps);
  if(path==='/Identity/BloodRequest/Capabilities')return ok(requestCaps);
  if(path==='/Identity/BloodBank/Capabilities')return ok(caps());
  if(path.endsWith('/BankQueue'))return ok(pageData(returned?[]:[request.request]));
  if(path.endsWith('/Bank/'+requestGuid))return returned?ok({detail:'returned'},400):ok(request);
  if(path.endsWith('/BloodBank/Stats'))return ok({total:unit?1:0,available:unit?.status==='Available'?1:0,reserved:unit?.status==='Reserved'?1:0,thawing:unit?.status==='Thawing'?1:0,ready:unit?.status==='Ready'?1:0,hold:unit&&['Quarantined','ReceivedHold'].includes(unit.status)?1:0,expired:0,expiringSoon:unit?1:0,discarded:unit?.status==='Discarded'?1:0,approvedRequests:returned?0:1,temperatureConcerns:temps.filter(x=>x.assessment!=='Acceptable').length});
  if(path.endsWith('/Inventory'))return ok(pageData(unit&&(!body.status||body.status===unit.status||body.status==='ExpiringSoon')&&(!body.requestGuid||body.requestGuid===unit.requestGuid)?[unit]:[]));
  if(path.endsWith('/TemperatureHistory'))return ok(pageData(temps));
  if(path.endsWith('/BloodBank/Temperature')){
   temps.unshift({guid:'temp-'+temps.length,equipmentCode:body.equipmentCode,measuredAt:body.measuredAt,recordedAt:now(),temperature:body.temperature,assessment:body.assessment,notes:body.notes,actorUserGuid:unitGuid});
   if(unit&&body.assessment!=='Acceptable'){let prev=unit.status;unit.status='Quarantined';unit.version=String(++version);log('TemperatureHold',prev,body.notes);}
   return ok('temp',200);
  }
  if(path.endsWith('/Receive')){expect(body.unitCode).toBe('FIX-FFP-04');expect(body.productCode).toBe('FFP');unit={guid:unitGuid,...body,status:'ReceivedHold',expired:false,requestGuid:null,thawStartedAt:null,thawCompletedAt:null,version:String(++version)};log('Receive','',body.notes);return ok(unitGuid,201);}
  if(path.endsWith('/Unit/'+unitGuid)&&unit)return ok({unit,events,tests,latestTemperature:temps[0]??null});
  if(path.endsWith('/BloodBank/Test')){
   expect(body.unitVersion).toBe(unit.version);expect(body.requestVersion).toBe(request.version);expect(body.conclusion).toBe('Accepted');
   tests.unshift({...body,guid:'lab-1',submissionAttempt:1,recordedAt:now(),actorUserGuid:unitGuid});unit.version=String(++version);log('Test',unit.status,body.notes);return ok('lab-1');
  }
  if(path.endsWith('/BloodBank/ReturnRequest')){expect(role).toBe('supervisor');expect(unit.requestGuid).toBe(null);returned=true;return route.fulfill({status:204});}
  const next={Inspect:'Available',Reserve:'Reserved',StartThaw:'Thawing',FinishThaw:'Reserved',Ready:'Ready',Hold:'Quarantined',Unreserve:'Quarantined',Discard:'Discarded'}[body.action];
  if(next&&unit){expect(body.version).toBe(unit.version);if(body.action==='Inspect'||body.action==='Discard')expect(role).toBe('supervisor');if(body.action==='Reserve'){expect(body.requestGuid).toBe(requestGuid);expect(tests[0].conclusion).toBe('Accepted');unit.requestGuid=requestGuid;}
   if(body.action==='StartThaw')unit.thawStartedAt=now();if(body.action==='FinishThaw'){unit.thawCompletedAt=now();unit.expiresAt=body.effectiveExpiry;}
   if(body.action==='Unreserve')unit.requestGuid=null;
   const prev=unit.status;unit.status=next;unit.version=String(++version);log(body.action,prev,body.reason,{method:body.method,temperature:body.temperature,effectiveExpiry:body.effectiveExpiry});return route.fulfill({status:204});
  }
  return ok({detail:'Unexpected '+path},404);
 });
 const action=async(name,extra)=>{await page.getByRole('button',{name,exact:true}).click();await page.getByLabel('شرح اقدام مستند *').fill('ثبت آزمایشی');if(extra)await extra();await page.getByRole('button',{name:'ثبت اقدام',exact:true}).click();await expect(page.getByText('عملیات ثبت شد: '+name,{exact:true})).toBeVisible();};
 await page.goto('/');await expect(page).toHaveURL(/\/hemo\/bank$/);await expect(page.getByRole('heading',{name:'داشبورد کارشناس بانک خون'})).toBeVisible();
 await page.goto('/hemo/bank/temperature');
 await page.getByLabel('کد تجهیز *',{exact:true}).fill('FIX-FREEZER');
 await page.getByLabel('دمای اندازه‌گیری‌شده (°C) *',{exact:true}).fill('-25');
 await page.getByLabel('ارزیابی مستند *',{exact:true}).selectOption('Acceptable');
 await page.getByRole('button',{name:'ثبت دما',exact:true}).click();await expect(page.getByText('اندازه‌گیری ثبت شد.',{exact:true})).toBeVisible();
 await page.goto('/hemo/bank/receive');
 await page.getByLabel('کد واحد / بارکد *').fill('FIX-FFP-04');
 await page.getByLabel('نوع فرآورده *').selectOption('FFP');
 await page.getByLabel('گروه خونی روی لیبل *').selectOption('O+');
 await page.getByLabel('مرکز تأمین / مرجع مستند *').fill('Fixture supplier');
 await page.getByLabel('کد تجهیز نگهداری *').fill('FIX-FREEZER');
 await page.getByLabel('تاریخ انقضای لیبل (شمسی) *').fill(dateInput(expiry));
 await page.getByLabel('ساعت انقضای لیبل (محلی) *').fill(timeInput(expiry));
 await page.getByRole('button',{name:'ثبت دریافت',exact:true}).click();await expect(page.getByRole('heading',{name:'FIX-FFP-04'})).toBeVisible();
 await expect(page.getByRole('button',{name:'تأیید بازرسی',exact:true})).toHaveCount(0);
 role='supervisor';await page.goto('/hemo/bank/unit/'+unitGuid);await action('تأیید بازرسی');
 role='operator';await page.goto('/hemo/requests/bank/'+requestGuid);
 await page.getByRole('link',{name:'پردازش درخواست در بانک خون'}).click();
 await page.getByRole('link',{name:'جزئیات / عملیات'}).click();
 await expect(page.getByRole('heading',{name:'ثبت نتیجه آزمایش مستند'})).toBeVisible();
 await page.getByLabel('شناسه نمونه *').fill('FIX-SAMPLE');await page.getByLabel('نتیجه لوله دوم / تطبیق مستند *').selectOption('Confirmed');await page.getByLabel('گروه روی لیبل کنترل‌شده *').selectOption('O+');
 await page.getByLabel('روش ثبت‌شده آزمایش *').fill('Fixture laboratory record');
 for(const field of ['فاز فوری (IS) *','فاز ۳۷ درجه *','فاز آنتی‌گلوبولین (AHG) *','Direct Coombs (DAT) *','Antibody Screening *'])await page.getByLabel(field,{exact:true}).selectOption('NonReactive');
 await page.getByLabel('مرجع گزارش آزمایشگاه *').fill('FIX-REPORT');await page.getByLabel('نتیجه مستند کارشناس *').selectOption('Accepted');
 await page.getByRole('button',{name:'ثبت نتیجه آزمایش'}).click();await expect(page.getByText('نتیجه آزمایش ثبت شد.',{exact:true})).toBeVisible();
 await action('رزرو');await expect(page.getByRole('button',{name:'آماده‌سازی تحویل',exact:true})).toHaveCount(0);
 await action('شروع ذوب',()=>page.getByLabel('روش ذوب ثبت‌شده *').fill('Fixture procedure'));
 const shortExpiry=new Date(Date.now()+3600000).toISOString();
 await action('ثبت پایان ذوب',async()=>{await page.getByLabel('روش ذوب ثبت‌شده *').fill('Fixture procedure');await page.getByLabel('دمای اندازه‌گیری‌شده (°C) *').fill('35');await page.getByLabel('تاریخ انقضای مستند پس از ذوب (شمسی) *').fill(dateInput(shortExpiry));await page.getByLabel('ساعت محلی انقضای مستند *').fill(timeInput(shortExpiry));});
 await action('آماده‌سازی تحویل');await expect(page.getByText('آماده بررسی تحویل',{exact:true}).first()).toBeVisible();
 await page.goto('/hemo/bank/temperature');await page.getByLabel('کد تجهیز *',{exact:true}).fill('FIX-FREEZER');await page.getByLabel('دمای اندازه‌گیری‌شده (°C) *').fill('9');await page.getByLabel('ارزیابی مستند *',{exact:true}).selectOption('Concern');await page.getByLabel('توضیحات و اقدام انجام‌شده').fill('Fixture concern');await page.getByRole('button',{name:'ثبت دما',exact:true}).click();await expect(page.getByText('اندازه‌گیری ثبت شد.',{exact:true})).toBeVisible();
 await page.goto('/hemo/bank/unit/'+unitGuid);await expect(page.getByText('قرنطینه',{exact:true}).first()).toBeVisible();await expect(page.getByRole('button',{name:'آماده‌سازی تحویل',exact:true})).toHaveCount(0);
 await action('لغو رزرو');role='supervisor';await page.goto('/hemo/bank/unit/'+unitGuid);await expect(page.getByRole('button',{name:'تأیید بازرسی',exact:true})).toHaveCount(0);await action('ثبت امحا');
 await page.goto('/hemo/bank/crossmatch?request='+requestGuid);await page.getByLabel('دلیل برگشت درخواست').fill('Fixture return');await page.getByRole('button',{name:'برگشت درخواست برای اصلاح (پس از لغو همه رزروها)'}).click();await expect(page.getByText('درخواستی یافت نشد.',{exact:true})).toBeVisible();
});
