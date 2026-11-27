import {test,expect} from '@playwright/test';
const unitGuid='33330000-1111-4111-8111-000000000003',requestGuid='44440000-1111-4111-8111-000000000004',admissionGuid='55550000-1111-4111-8111-000000000005',transferGuid='66660000-1111-4111-8111-000000000006';
const caps={list:true,detail:true,stats:true,candidates:false,dispatch:false,receive:false,receiptHold:false,verify:false,witness:false,start:false,vital:false,complete:false,stop:false,return:false,acceptReturn:false,dispose:false,doctorNote:false};
const capabilities=role=>({...caps,userGuid:role,...(role==='supervisor'?{candidates:true,dispatch:true,return:true,acceptReturn:true,dispose:true}:role==='nurse'?{receive:true,receiptHold:true,verify:true,witness:true,start:true,vital:true,complete:true,stop:true,return:true}:role==='witness'?{witness:true}:role==='doctor'?{doctorNote:true,stop:true}:{acceptReturn:true})});
const pageData=data=>({data,pageNumber:1,totalCount:data.length,totalPages:data.length?1:0,hasPreviousPage:false,hasNextPage:false});
test('dispatch, distinct witness, observation, completion and return worklists',async({page})=>{
 test.setTimeout(90000);
 let role='supervisor',serial=0,transfers=new Map();
 const candidates=[1,2,3].map(i=>({unitGuid:unitGuid.slice(0,-1)+i,unitVersion:'unit-'+i,unitCode:'DEMO-UNIT-0'+i,productCode:'RBC',bloodGroup:'O+',expiresAt:new Date(Date.now()+86400000).toISOString(),requestGuid,requestNumber:'DEMO-BR-ST05-0'+i,patientName:'بیمار ساختگی '+i,hisNumber:'DEMO-ST05-0'+i,ward:'بخش آموزشی',wristbandCode:'DEMO-WRIST-0'+i}));
 const now=()=>new Date().toISOString();
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'fixture-token',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 page.on('dialog',d=>d.accept());
 await page.route('**/Identity/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON()??{};
  const ok=(json,status=200)=>route.fulfill({status,json});
  if(path.endsWith('/GetCurrentUserRoles'))return ok([{name:role,gkey:1,orgLocationName:'آزمون',organizationName:'آزمون'}]);
  if(path.endsWith('/Capabilities'))return ok(path.includes('/Transfusion/')?capabilities(role):{});
  if(path.endsWith('/Transfusion/Candidates'))return ok(pageData(candidates.filter(c=>![...transfers.values()].some(d=>d.transfer.unitGuid===c.unitGuid)&&(!body.search||c.unitCode.includes(body.search)))));
  if(path.endsWith('/Transfusion/Stats')){
   const rows=[...transfers.values()].map(d=>d.transfer);const n=s=>rows.filter(x=>x.status===s).length;
   return ok({total:rows.length,dispatched:n('Dispatched'),received:n('Received'),receiptHold:n('ReceiptHold'),verified:n('Verified'),witnessed:n('Witnessed'),inProgress:n('InProgress'),completed:n('Completed'),stopped:n('Stopped'),returning:n('Returning'),returned:n('Returned'),disposed:n('Disposed'),suspectedReactions:rows.filter(x=>x.suspectedReaction).length});
  }
  if(path.endsWith('/Transfusion/List')){
   const rows=[...transfers.values()].map(d=>d.transfer).filter(t=>!body.status||body.status===t.status||body.status==='Active'&&['Dispatched','Received','Verified','Witnessed','InProgress'].includes(t.status)||body.status==='ReturnQueue'&&['Returning','Returned','ReceiptHold','Stopped'].includes(t.status));
   return ok(pageData(rows));
  }
  if(path.endsWith('/Transfusion/Dispatch')){
   expect(role).toBe('supervisor');const c=candidates.find(x=>x.unitGuid===body.unitGuid);
   expect(body.unitCode).toBe(c.unitCode);expect(body.wristbandCode).toBe(c.wristbandCode);expect(body.checks).toBe(31);
   const id=transferGuid.slice(0,-1)+c.unitCode.at(-1);
   const d={transfer:{guid:id,transferNumber:'TX-'+c.unitCode,unitGuid:c.unitGuid,requestGuid:c.requestGuid,admissionGuid,patientName:c.patientName,hisNumber:c.hisNumber,ward:c.ward,unitCode:c.unitCode,productCode:c.productCode,bloodGroup:c.bloodGroup,status:'Dispatched',dispatchedAt:now(),receivedAt:null,startedAt:null,endedAt:null,suspectedReaction:false,volumeMl:null,version:String(++serial)},wristbandCode:c.wristbandCode,requestNumber:c.requestNumber,labReportReference:'DEMO-REPORT',labRecordedAt:now(),expiresAt:c.expiresAt,carrierName:body.carrierName,carrierCode:body.carrierCode,containerCode:body.containerCode,dispatchTemperature:body.temperature,transportIndicator:body.transportIndicator,packCount:body.packCount,verifiedBy:null,witnessedBy:null,startedBy:null,admissionChanged:false,canProceed:true,demo:true,events:[],vitals:[]};
   d.events.push({action:'Dispatch',previousStatus:'',newStatus:'Dispatched',occurredAt:now(),actorUserGuid:role,actorRoleGuid:role,notes:body.notes,evidenceJson:JSON.stringify({UnitCode:body.unitCode})});
   transfers.set(id,d);return ok(id,201);
  }
  if(path.includes('/Transfusion/Detail/'))return ok(transfers.get(path.split('/').at(-1)));
  const d=transfers.get(body.guid);if(!d)return ok({detail:'Unexpected '+path},404);
  expect(body.version).toBe(d.transfer.version);
  const action=path.split('/').at(-1),before=d.transfer.status;
  if(action==='Vital'){
   expect(role).toBe('nurse');expect(body.measuredAt).toBeTruthy();expect(body.rateMlPerHour).toBe(10);d.vitals.push({...body,guid:'vital-'+serial,recordedAt:now(),actorUserGuid:role});
  }else{
   if(['Receive','Verify','Witness','Start'].includes(action)){expect(body.unitCode).toBe(d.transfer.unitCode);expect(body.wristbandCode).toBe(d.wristbandCode);expect(body.checks).toBe(31);}
   if(action==='Verify'){d.verifiedBy=role;d.witnessedBy=null;}
   if(action==='Witness'){expect(role).not.toBe(d.verifiedBy);d.witnessedBy=role;}
   if(action==='Start'){expect(role).toBe(d.verifiedBy);expect(d.witnessedBy).not.toBe(role);expect(d.vitals.some(x=>x.phase==='T0')).toBe(true);d.startedBy=role;d.transfer.startedAt=now();}
   if(action==='Receive'||action==='ReceiptHold')d.transfer.receivedAt=now();
   if(action==='Complete'){expect(body.volumeMl).toBe(100);expect(d.vitals.some(x=>x.phase==='End')).toBe(true);d.transfer.endedAt=now();d.transfer.volumeMl=body.volumeMl??null;d.canProceed=false;}
   if(action==='Stop'){d.transfer.endedAt=now();d.canProceed=false;}
   if(body.suspectedReaction)d.transfer.suspectedReaction=true;
   if(action==='Return')d.canProceed=false;
   d.transfer.status=({Receive:'Received',ReceiptHold:'ReceiptHold',Verify:'Verified',Witness:'Witnessed',Start:'InProgress',Complete:'Completed',Stop:'Stopped',Return:'Returning',AcceptReturn:'Returned',Dispose:'Disposed'})[action]??before;
  }
  d.transfer.version=String(++serial);d.events.push({action,previousStatus:before,newStatus:d.transfer.status,occurredAt:now(),actorUserGuid:role,actorRoleGuid:role,notes:body.notes,evidenceJson:null});
  return action==='Vital'?ok('vital-'+serial):route.fulfill({status:204});
 });
 const fillChecks=async()=>{const boxes=page.getByRole('checkbox');await expect(boxes).toHaveCount(5);for(const box of await boxes.all())await box.check();};
 const dispatch=async(i)=>{
  await page.goto('/hemo/transfusion/dispatch');await page.getByRole('row').filter({hasText:'DEMO-UNIT-0'+i}).getByRole('button',{name:'انتخاب برای صدور'}).click();
  await page.getByLabel('کد مشاهده‌شده واحد *',{exact:true}).fill('DEMO-UNIT-0'+i);
  await page.getByLabel('کد مشاهده‌شده مچ‌بند / مرجع شناسایی *').fill('DEMO-WRIST-0'+i);
  await page.getByLabel('نام حامل *').fill('Fixture carrier');await page.getByLabel('کد پرسنلی حامل *').fill('FIX');
  await page.getByLabel('کد / نوع ظرف حمل *').fill('FIX-BOX');await page.getByLabel('دمای ثبت‌شده خروج (°C) *').fill('0');
  await page.getByLabel('نشانگر / مرجع ثبت شرایط حمل *').fill('Fixture only');await fillChecks();
  await page.getByLabel('شرح و مرجع بررسی *').fill('Synthetic exercise');
  await page.getByRole('button',{name:'ثبت صدور و ارسال',exact:true}).click();
  try{await expect(page).toHaveURL(/\/hemo\/transfusion\/detail\//);}catch(error){console.log('ST05 dispatch diagnostic',await page.locator('body').innerText());throw error;}await expect(page.getByRole('heading',{name:'حواله، تطبیق و فرم پایش تزریق'})).toBeVisible();return page.url();
 };
 const action=async(name,i,opts={})=>{
  await page.getByRole('button',{name,exact:true}).click();
  if(opts.codes){await page.getByLabel('کد مشاهده‌شده واحد *',{exact:true}).fill('DEMO-UNIT-0'+i);await page.getByLabel('کد مشاهده‌شده مچ‌بند *',{exact:true}).fill('DEMO-WRIST-0'+i);for(const box of await page.locator('form').filter({has:page.getByRole('button',{name:'ثبت عملیات',exact:true})}).getByRole('checkbox').all())await box.check();}
  if(opts.unit)await page.getByLabel('کد مشاهده‌شده واحد *',{exact:true}).fill(opts.mismatch?'WRONG':'DEMO-UNIT-0'+i);
  if(opts.person)await page.getByLabel('نام فرد مرتبط / دریافت‌کننده *').fill('Fixture');
  if(opts.receive){await page.getByLabel('ارزیابی شرایط دریافت *',{exact:true}).selectOption('Acceptable');await page.getByLabel('دمای ثبت‌شده (°C) *',{exact:true}).fill('0');}
  if(opts.condition)await page.getByLabel('وضعیت مشاهده‌شده / علت مغایرت *').fill('Fixture condition');
  if(opts.temp)await page.getByLabel('دمای ثبت‌شده (°C) *',{exact:true}).fill('0');
  if(opts.start)await page.getByLabel('مشخصات وسیله مورد استفاده / مرجع مستند *').fill('Fixture device');
  if(opts.volume!==undefined)await page.getByLabel('حجم تزریق‌شده ثبت‌شده (mL، در صورت وجود)').fill(String(opts.volume));
  if(opts.reaction)await page.getByLabel('نگرانی / واکنش مشکوک مشاهده‌شده ثبت شود').check();
  await page.getByLabel('شرح مستند عملیات *').fill('Synthetic exercise');
  await page.getByRole('button',{name:'ثبت عملیات',exact:true}).click();
  await expect(page.getByText('عملیات ثبت شد: '+name,{exact:true})).toBeVisible();
 };
 const vital=async phase=>{await page.getByLabel('نوبت پایش *',{exact:true}).selectOption(phase);
  for(const [label,value] of [['فشار سیستولیک (mmHg)','120'],['فشار دیاستولیک (mmHg)','80'],['نبض (bpm)','75'],['دمای بدن (°C)','37'],['SpO₂ (%)','98'],['تنفس (در دقیقه)','16']])await page.getByLabel(label,{exact:true}).fill(value);
  await page.getByLabel('سرعت مشاهده‌شده (mL/h)',{exact:true}).fill('10');
  await page.getByRole('button',{name:'ثبت پایش',exact:true}).click();await expect(page.getByText('پایش علائم ثبت شد.',{exact:true})).toBeVisible();};
 const one=await dispatch(1),two=await dispatch(2),three=await dispatch(3);
 role='nurse';await page.goto(one);await action('تأیید دریافت بخش',1,{codes:true,person:true,receive:true});await action('ثبت تطبیق اول',1,{codes:true});
 await expect(page.getByRole('button',{name:'تأیید مستقل شاهد',exact:true})).toHaveCount(0);
 role='witness';await page.goto(one);await action('تأیید مستقل شاهد',1,{codes:true});await expect(page.getByRole('button',{name:'ثبت شروع تزریق',exact:true})).toHaveCount(0);
 role='nurse';await page.goto(one);await vital('T0');await action('ثبت شروع تزریق',1,{codes:true,start:true});await vital('T15');await vital('End');await action('ثبت پایان تزریق',1,{volume:100});await vital('Post1h');
 await expect(page.getByText('پایان ثبت‌شده',{exact:true}).first()).toBeVisible();
 await page.goto(two);await action('ثبت مغایرت دریافت',2,{unit:true,mismatch:true,person:true,condition:true});await expect(page.getByRole('button',{name:'ثبت تطبیق اول',exact:true})).toHaveCount(0);
 await action('ارسال مرجوعی',2,{unit:true,person:true,condition:true});
 role='bank';await page.goto(two);await action('تأیید دریافت مرجوعی',2,{unit:true,person:true,condition:true,temp:true});
 await expect(page.getByRole('button',{name:'ثبت امحای مرجوعی',exact:true})).toHaveCount(0);
 role='supervisor';await page.goto(two);await action('ثبت امحای مرجوعی',2,{unit:true});
 role='nurse';await page.goto(three);await action('تأیید دریافت بخش',3,{codes:true,person:true,receive:true});await action('ثبت تطبیق اول',3,{codes:true});
 role='witness';await page.goto(three);await action('تأیید مستقل شاهد',3,{codes:true});
 role='nurse';await page.goto(three);await vital('T0');await action('ثبت شروع تزریق',3,{codes:true,start:true});
 role='doctor';await page.goto(three);await action('ثبت یادداشت پزشک',3,{reaction:true});await action('ثبت توقف تزریق',3,{reaction:true});
 await expect(page.getByText('نگرانی / واکنش مشکوک ثبت شده است.',{exact:true})).toBeVisible();
 await page.goto('/hemo/transfusion/returns');await expect(page.getByRole('row').filter({hasText:'DEMO-UNIT-03'})).toBeVisible();
});
