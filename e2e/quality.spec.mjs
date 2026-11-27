import {test,expect} from '@playwright/test';
const equipmentGuid='11110000-1111-4111-8111-000000000007',committeeGuid='22220000-1111-4111-8111-000000000007',lineGuid='33330000-1111-4111-8111-000000000007',qcGuid='44440000-1111-4111-8111-000000000007';
const now=()=>new Date().toISOString();
const permissions=role=>({equipmentList:true,equipmentDetail:true,equipmentService:role==='tech',equipmentRelease:role==='reviewer',equipmentTemperature:role==='tech',equipmentHold:role==='tech',committeeList:true,committeeDetail:true,committeeProgress:role==='nurse',committeeVerify:role==='reviewer',committeeClose:role==='reviewer',qcList:true,qcDetail:true,qcApprove:role==='reviewer'});
test('equipment service, independent release, temperature hold, committee resolution and QC review',async({page})=>{
 test.setTimeout(100000);
 let role='tech',serial=0;
 const equipment={guid:equipmentGuid,code:'DEMO-ST07-FRIDGE',name:'یخچال آموزشی',category:'Refrigerator',brandModel:'Fixture',ward:'آموزشی',serialNumber:null,status:'Hold',calibrationAt:null,calibrationDueAt:null,maintenanceDueAt:null,version:'e0'};
 const detail={equipment,events:[],incidents:[],temperatures:[],storedUnits:1,demo:true};
 const committee={record:{guid:committeeGuid,kind:'Committee',number:'DEMO-ST07-BTC-01',title:'کمیته آموزشی',ward:'آموزشی',status:'Approved',occurredAt:now(),createdByUserGuid:'officer',reviewedAt:now(),version:'c0',demo:true},header:{chair:'رئیس',secretary:'دبیر',participants:'اعضا',agenda:'آزمون'},lines:[{guid:lineGuid,title:'مصوبه آموزشی',data:{indicator:'مستند انجام کار'},status:'Open',ownerUserGuid:'nurse',dueAt:'2099-01-01T00:00:00Z',progress:0,evidence:null,verifiedBy:null,verifiedAt:null,version:'l0'}],events:[],reviewNotes:'آموزشی',reviewedBy:'reviewer',auditScore:null,auditMaximum:null};
 const qc={record:{...committee.record,guid:qcGuid,kind:'Qc',number:'DEMO-ST07-QC-01',title:'کنترل کیفیت آموزشی',status:'Submitted',createdByUserGuid:'bank',version:'q0'},header:{shift:'Morning',operator:'کارشناس'},lines:[],events:[],reviewNotes:null,reviewedBy:null,auditScore:null,auditMaximum:null};
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'fixture-token',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 page.on('dialog',d=>d.accept());
 await page.route('**/Identity/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON()??{},action=path.split('/').at(-1);
  const ok=json=>route.fulfill({status:200,json}),no=()=>route.fulfill({status:204});
  if(action==='GetCurrentUserRoles')return ok([{name:role,gkey:1,orgLocationName:'آزمون',organizationName:'آزمون'}]);
  if(action==='Capabilities')return ok(path.includes('/HemoQuality/')?{permissions:permissions(role),userGuid:role}:{});
  if(!path.includes('/HemoQuality/'))return ok({});
  if(path.endsWith('/EquipmentDetail/'+equipmentGuid))return ok(detail);
  if(path.endsWith('/CommitteeDetail/'+committeeGuid))return ok(committee);
  if(path.endsWith('/QcDetail/'+qcGuid))return ok(qc);
  if(action==='EquipmentService'){
   expect(role).toBe('tech');expect(body.version).toBe(equipment.version);expect(body.kind).toBe('Calibration');expect(body.result).toBe('Accepted');expect(body.reference).toBe('FIXTURE-CERT');
   equipment.calibrationAt=body.performedAt;equipment.calibrationDueAt=body.dueAt;equipment.version='e'+ ++serial;detail.events.push({kind:'Calibration',previousStatus:'Hold',newStatus:'Hold',occurredAt:now(),actorUserGuid:role,notes:body.notes,reference:body.reference,provider:body.provider,dueAt:body.dueAt,evidenceJson:null});return no();
  }
  if(action==='EquipmentRelease'){expect(role).toBe('reviewer');expect(body.version).toBe(equipment.version);equipment.status='Operational';equipment.version='e'+ ++serial;return no();}
  if(action==='EquipmentTemperature'){expect(role).toBe('tech');expect(body.assessment).toBe('Concern');expect(body.temperature).toBe(8);equipment.status='Hold';equipment.version='e'+ ++serial;detail.temperatures.push({guid:'temp-1',equipmentCode:equipment.code,measuredAt:body.measuredAt,recordedAt:now(),temperature:body.temperature,assessment:body.assessment,notes:body.notes,actorUserGuid:role});return no();}
  if(action==='CommitteeProgress'){expect(role).toBe('nurse');expect(body.progress).toBe(100);expect(body.lineGuid).toBe(lineGuid);committee.lines[0].status='Submitted';committee.lines[0].progress=100;committee.lines[0].evidence=body.evidence;committee.lines[0].version='l1';committee.record.version='c1';return no();}
  if(action==='CommitteeVerify'){expect(role).toBe('reviewer');expect(body.lineVersion).toBe('l1');committee.lines[0].status='Verified';committee.lines[0].version='l2';committee.record.version='c2';return no();}
  if(action==='CommitteeClose'){expect(role).toBe('reviewer');expect(body.version).toBe('c2');committee.record.status='Closed';return no();}
  if(action==='QcApprove'){expect(role).toBe('reviewer');expect(body.version).toBe('q0');qc.record.status='Approved';return no();}
  return route.fulfill({status:404,json:{title:'Unhandled fixture '+path}});
 });
 const btn=name=>page.getByRole('button',{name,exact:true}),fill=(name,value)=>page.getByLabel(name,{exact:true}).fill(value);
 const gotoEquipment=()=>page.goto('/hemo/quality/equipment/'+equipmentGuid);
 const submitEquipment=()=>btn('ثبت عملیات تجهیز').click();
 await gotoEquipment();await btn('ثبت سرویس / کالیبراسیون').click();await page.getByLabel('زمان جاری، فقط در صورت انجام واقعی در همین لحظه').check();
 await page.getByLabel('نوع سرویس *',{exact:true}).selectOption('Calibration');await page.getByLabel('نتیجه فنی ثبت‌شده *',{exact:true}).selectOption('Accepted');
 await fill('شرکت / مجری *','Fixture');await fill('سررسید بعدی شمسی','1490/01/01');await fill('آزمون‌ها و کنترل‌های واقعاً انجام‌شده *','Fixture checks');await fill('مرجع / شماره گواهی مستند *','FIXTURE-CERT');await fill('شرح و مستند عملیات *','Fixture service');await submitEquipment();
 await expect(page.getByText('عملیات ثبت شد: ثبت سرویس / کالیبراسیون',{exact:true})).toBeVisible();await expect(btn('تأیید مستقل بازگشت تجهیز')).toHaveCount(0);
 role='reviewer';await gotoEquipment();await btn('تأیید مستقل بازگشت تجهیز').click();await fill('شرح و مستند عملیات *','Fixture review');await fill('مرجع / شماره گواهی مستند *','FIXTURE-REVIEW');await submitEquipment();await expect(page.getByText('عملیات ثبت شد: تأیید مستقل بازگشت تجهیز',{exact:true})).toBeVisible();
 role='tech';await gotoEquipment();await btn('ثبت پایش دما').click();await page.getByLabel('زمان جاری، فقط در صورت انجام واقعی در همین لحظه').check();await page.getByLabel('شیفت *',{exact:true}).selectOption('Morning');await fill('دمای لحظه‌ای (°C) *','8');await fill('حداقل ثبت‌شده (°C) *','7');await fill('حداکثر ثبت‌شده (°C) *','9');await page.getByLabel('ارزیابی مستند *',{exact:true}).selectOption('Concern');await fill('شرح و مستند عملیات *','Fixture concern');await submitEquipment();await expect(page.getByText('عملیات ثبت شد: ثبت پایش دما',{exact:true})).toBeVisible();
 role='nurse';await page.goto('/hemo/quality/committee/'+committeeGuid);await btn('ثبت پیشرفت مصوبه').click();await fill('درصد پیشرفت (۰ تا ۱۰۰) *','100');await fill('شرح و شواهد اجرا / بازبینی *','Fixture evidence');await btn('ثبت پیگیری مصوبه').click();await expect(btn('ثبت پیشرفت مصوبه')).toHaveCount(0);
 role='reviewer';await page.goto('/hemo/quality/committee/'+committeeGuid);await btn('تأیید مستقل مصوبه').click();await fill('شرح و شواهد اجرا / بازبینی *','Fixture verification');await btn('ثبت پیگیری مصوبه').click();await expect(btn('تأیید مستقل مصوبه')).toHaveCount(0);await btn('بستن صورت‌جلسه').click();await fill('شرح مستند عملیات *','Fixture closing');await btn('ثبت عملیات پرونده').click();await expect(btn('بستن صورت‌جلسه')).toHaveCount(0);
 await page.goto('/hemo/quality/qc/'+qcGuid);await btn('تأیید مستقل پرونده').click();await fill('شرح مستند عملیات *','Fixture QC review');await btn('ثبت عملیات پرونده').click();await expect(btn('تأیید مستقل پرونده')).toHaveCount(0);
});
