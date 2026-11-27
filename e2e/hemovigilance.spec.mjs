import {test,expect} from '@playwright/test';
const caseId='66660000-1111-4111-8111-000000000006',transferId='55550000-1111-4111-8111-000000000005',capaId='77770000-1111-4111-8111-000000000007',reportId='88880000-1111-4111-8111-000000000008';
const now=()=>new Date().toISOString(),pageData=data=>({data,pageNumber:1,totalCount:data.length,totalPages:data.length?1:0,hasPreviousPage:false,hasNextPage:false});
const cap=role=>({list:true,detail:true,stats:true,candidates:role==='nurse'||role==='officer',report:role==='nurse'||role==='officer',observe:role!=='reviewer',doctorReview:role==='doctor',bankReview:role==='bank',investigate:role==='officer',returnToDoctor:role==='officer',publishRca:role==='officer',assignCapa:role==='officer',owners:role==='officer',capaProgress:role==='nurse',capaVerify:role==='reviewer',close:role==='reviewer',external:role==='officer',reports:['officer','reviewer'].includes(role),archive:role==='officer',reportExternal:role==='officer',userGuid:role});
test('reaction intake, doctor and bank reviews, RCA, independent CAPA and archived summary',async({page})=>{
 test.setTimeout(100000);let role='nurse',serial=0,d=null,archive=null;
 const candidate={guid:transferId,transferNumber:'DEMO-TX-ST06-01',patientName:'بیمار ساختگی',hisNumber:'DEMO-ST06-01',ward:'آموزشی',productCode:'RBC',unitCode:'DEMO-HV-UNIT-01',status:'Stopped',startedAt:new Date(Date.now()-3600000).toISOString(),endedAt:new Date(Date.now()-1800000).toISOString(),suspectedReaction:true,version:'tx1'};
 const summary=()=>({total:d?1:0,open:d&&d.case.status!=='Closed'?1:0,closed:d?.case.status==='Closed'?1:0,pendingDoctor:d?.case.status==='Reported'?1:0,pendingBank:d?.case.status==='DoctorReviewed'?1:0,rcaOpen:d?.case.status==='RcaOpen'?1:0,capaMonitoring:d?.case.status==='CapaMonitoring'?1:0,capaOpen:d?.actions.filter(x=>x.status!=='Verified').length??0,capaOverdue:0,externalPending:d?.externalStatus==='Required'?1:0,startedTransfers:1,byDiagnosis:d?[{key:d.case.diagnosisCode??'Undetermined',count:1}]:[],bySeverity:d?[{key:d.case.severity??'Unknown',count:1}]:[],byWard:d?[{key:'آموزشی',count:1}]:[],byProduct:d?[{key:'RBC',count:1}]:[],byStatus:d?[{key:d.case.status,count:1}]:[]});
 await page.addInitScript(()=>sessionStorage.setItem('hemo-asd-session',JSON.stringify({key:'fixture-token',firstName:'کاربر',lastName:'آزمون',expireDate:'2099-01-01T00:00:00Z',forceChangePassword:false,multiLogin:false,userRole:1})));
 page.on('dialog',dialog=>dialog.accept());
 await page.route('**/Identity/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON()??{},action=path.split('/').at(-1);
  const ok=(json,status=200)=>route.fulfill({status,json});const no=()=>route.fulfill({status:204});
  if(action==='GetCurrentUserRoles')return ok([{name:role,gkey:1,orgLocationName:'آزمون',organizationName:'آزمون'}]);
  if(action==='Capabilities')return ok(path.includes('/Hemovigilance/')?cap(role):{});
  if(!path.includes('/Hemovigilance/'))return ok({},404);
  if(action==='Candidates')return ok(pageData(d?[]:[candidate]));
  if(action==='Stats')return ok(summary());
  if(action==='List')return ok(pageData(d&&(!body.status||body.status===d.case.status||body.status==='Open'&&d.case.status!=='Closed')?[d.case]:[]));
  if(action==='Owners')return ok([{userGuid:'nurse',name:'پرستار آموزشی'}]);
  if(action==='Report'){
   expect(role).toBe('nurse');expect(body.transferGuid).toBe(transferId);expect(body.transferVersion).toBe('tx1');expect(body.symptoms).toContain('Unknown');expect(body.clientReportId).toBeTruthy();
   d={case:{guid:caseId,caseNumber:'HV-FIXTURE',transferGuid:transferId,transferNumber:candidate.transferNumber,patientName:candidate.patientName,hisNumber:candidate.hisNumber,ward:candidate.ward,productCode:candidate.productCode,unitCode:candidate.unitCode,status:'Reported',onsetAt:body.onsetAt,reportedAt:now(),initialSeverity:body.initialSeverity,diagnosisCode:null,severity:null,imputability:null,outcome:null,demo:true,version:String(++serial)},bloodGroup:'O+',transferStatus:'Stopped',startedAt:candidate.startedAt,endedAt:candidate.endedAt,suspectedReaction:true,symptoms:body.symptoms,initialNotes:body.notes,actionsTaken:body.actionsTaken,samplesSent:body.samplesSent,volumeMl:body.volumeMl,reporterUserGuid:'nurse',doctorUserGuid:null,doctorReviewedAt:null,doctorNotes:null,doctorActions:null,doctorLabRequest:null,futureRecommendations:null,doctorReference:null,bankUserGuid:null,bankReviewedAt:null,bankFindings:null,bankSampleReference:null,bankReportReference:null,bankDisposition:null,investigationNotes:null,externalStatus:'NotRecorded',externalReference:null,rcaRequired:null,rcaLead:null,rcaMethod:null,rcaMeetingAt:null,rcaParticipants:null,directCause:null,rootCause:null,rcaPublishedAt:null,closedAt:null,events:[],actions:[],vitals:[]};
   return ok(caseId,201);
  }
  if(path.includes('/ReportDetail/'))return ok(archive);
  if(path.includes('/Detail/'))return ok(d);
  if(action==='Reports')return ok(pageData(archive?[archive.report]:[]));
  if(action==='Archive'){expect(role).toBe('officer');archive={report:{guid:reportId,reportNumber:'HVR-FIXTURE',title:body.title,fromAt:body.from,toAt:body.to,ward:body.ward,productCode:body.productCode,preparedAt:now(),preparedBy:role,externalStatus:'NotRecorded',externalReference:null,version:'a1'},summary:summary()};return ok(reportId,201);}
  if(action==='ReportExternal'){expect(body.version).toBe(archive.report.version);archive.report.externalStatus=body.status;archive.report.externalReference=body.reference;archive.report.version='a2';return no();}
  if(action.startsWith('Capa')){
   const c=d.actions[0];expect(body.version).toBe(c.version);expect(body.caseVersion).toBe(d.case.version);
   if(action==='CapaProgress'){expect(role).toBe(c.ownerUserGuid);c.progress=body.progress;c.evidence=body.evidence;c.status=c.progress===100?'Submitted':'InProgress';c.submittedBy=c.progress===100?role:null;}
   else {expect(role).toBe('reviewer');expect(c.submittedBy).not.toBe(role);c.status=action==='CapaVerify'?'Verified':'Rejected';c.verificationNotes=body.evidence;}
   c.version=String(++serial);d.case.version=String(++serial);return no();
  }
  expect(body.version).toBe(d.case.version);const before=d.case.status;
  switch(action){
   case 'DoctorReview':expect(role).toBe('doctor');Object.assign(d.case,{status:'DoctorReviewed',diagnosisCode:body.diagnosisCode,severity:body.severity,imputability:body.imputability,outcome:body.outcome});Object.assign(d,{doctorReviewedAt:now(),doctorUserGuid:role,doctorNotes:body.notes,doctorActions:body.actions,doctorReference:body.doctorReference});break;
   case 'BankReview':expect(role).toBe('bank');d.case.status='BankReviewed';Object.assign(d,{bankReviewedAt:now(),bankUserGuid:role,bankFindings:body.notes,bankSampleReference:body.sampleReference,bankReportReference:body.reportReference,bankDisposition:body.disposition});break;
   case 'Investigate':expect(body.rcaRequired).toBe(true);d.case.status='RcaOpen';Object.assign(d,{rcaRequired:true,externalStatus:body.externalStatus,investigationNotes:body.notes});break;
   case 'AssignCapa':expect(role).toBe('officer');d.actions.push({guid:capaId,title:body.title,kind:body.kind,ownerUserGuid:body.ownerUserGuid,ownerName:'پرستار آموزشی',dueAt:body.dueAt,indicator:body.indicator,status:'Open',progress:0,evidence:null,submittedBy:null,version:'c1'});break;
   case 'PublishRca':expect(d.actions.length).toBe(1);d.case.status='CapaMonitoring';Object.assign(d,{rcaLead:body.rcaLead,rcaMethod:body.rcaMethod,rcaMeetingAt:body.meetingAt,rcaParticipants:body.participants,directCause:body.directCause,rootCause:body.rootCause,rcaPublishedAt:now()});break;
   case 'External':d.externalStatus=body.externalStatus;d.externalReference=body.externalReference;break;
   case 'Close':expect(role).toBe('reviewer');expect(d.actions.every(c=>c.status==='Verified')).toBe(true);expect(d.externalStatus).toBe('SentManually');d.case.status='Closed';d.closedAt=now();break;
   default:return ok({detail:'Unexpected '+path},404);
  }
  d.case.version=String(++serial);d.events.push({action,previousStatus:before,newStatus:d.case.status,occurredAt:now(),actorUserGuid:role,actorRoleGuid:role,notes:body.notes??body.title,evidenceJson:null});
  return action==='AssignCapa'?ok(capaId,201):no();
 });
 const fill=async(label,value='Synthetic fixture')=>page.getByLabel(label,{exact:true}).fill(value);
 const select=async(label,value)=>page.getByLabel(label,{exact:true}).selectOption(value);
 const begin=async name=>page.getByRole('button',{name,exact:true}).click();
 const submit=async name=>{await fill('شرح مستند عملیات *');await begin('ثبت عملیات پرونده');await expect(page.getByText('عملیات ثبت شد: '+name,{exact:true})).toBeVisible();};
 const change=async r=>{role=r;await page.goto('/hemo/hv/detail/'+caseId);await expect(page.getByRole('heading',{name:'پرونده واکنش و تحلیل هموویژیلانس'})).toBeVisible();};
 await page.goto('/hemo/hv/new');await begin('انتخاب حواله');await page.getByLabel('زمان جاری، فقط اگر زمان واقعی بروز همین لحظه است').check();
 await page.getByLabel('نامشخص',{exact:true}).check();await select('درجه اولیه ثبت‌شده *','Unknown');await fill('شرح مشاهده و علائم *');await fill('شرح اقدامات انجام‌شده یا وضعیت نامشخص *');await begin('ثبت نهایی گزارش اولیه');await expect(page).toHaveURL(/\/hemo\/hv\/detail\//);
 await change('doctor');await begin('تکمیل بررسی پزشک');await select('تشخیص ثبت‌شده *','Undetermined');await select('شدت ثبت‌شده *','Unknown');await select('ارتباط علّی ثبت‌شده *','Unknown');await select('پیامد ثبت‌شده *','Unknown');await fill('مرجع مستند پزشک / کد حرفه‌ای *');await fill('شرح اقدامات واقعاً انجام‌شده *');await submit('تکمیل بررسی پزشک');
 await change('bank');await begin('تکمیل بررسی بانک خون');await fill('وضعیت / مرجع نمونه *');await fill('مرجع گزارش یا عدم دسترسی مستند *');await fill('نتیجه و وضعیت بررسی بانک *');await submit('تکمیل بررسی بانک خون');
 await change('officer');await begin('بررسی مسئول و تصمیم RCA');await page.getByLabel('تصمیم مستند RCA *',{exact:true}).selectOption({label:'نیازمند RCA'});await select('وضعیت گزارش بیرونی *','Required');await submit('بررسی مسئول و تصمیم RCA');
 await begin('＋ تخصیص اقدام');await fill('شرح اقدام *');await select('نوع اقدام *','Corrective');await select('مسئول اجرا *','nurse');await fill('مهلت اجرا (شمسی) *','1490/01/01');await fill('شاخص اثربخشی *');await begin('ثبت تخصیص اقدام');await expect(page.getByText('اقدام اصلاحی / پیشگیرانه ثبت شد.',{exact:true})).toBeVisible();
 await begin('انتشار تحلیل RCA');await fill('رهبر تیم RCA *');await select('روش تحلیل *','FiveWhys');await fill('اعضای حاضر *');await fill('علت مستقیم مستند *');await fill('علت ریشه‌ای مستند *');await submit('انتشار تحلیل RCA');
 await change('nurse');await begin('ثبت پیشرفت / ارسال برای بازبینی');await fill('درصد پیشرفت (۰ تا ۱۰۰) *','100');await fill('شواهد اجرا / نظر بازبین *');await begin('ثبت پیگیری اقدام');await expect(page.getByText('پیگیری اقدام ثبت شد.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'تأیید مستقل اثربخشی',exact:true})).toHaveCount(0);
 await change('reviewer');await begin('تأیید مستقل اثربخشی');await fill('شواهد اجرا / نظر بازبین *');await begin('ثبت پیگیری اقدام');await expect(page.getByText('پیگیری اقدام ثبت شد.',{exact:true})).toBeVisible();
 await begin('بستن پرونده');await expect(page.getByRole('button',{name:'ثبت عملیات پرونده',exact:true})).toBeDisabled();
 await change('officer');await begin('ثبت وضعیت گزارش بیرونی');await select('وضعیت گزارش بیرونی *','SentManually');await fill('مرجع ارسال واقعی خارج سامانه *','DEMO-REF');await submit('ثبت وضعیت گزارش بیرونی');
 await page.goto('/hemo/hv/reports');await begin('تولید و ذخیره گزارش در آرشیو');await expect(page.getByText('گزارش داخلی در آرشیو ثبت شد.',{exact:true})).toBeVisible();
 await change('reviewer');await begin('بستن پرونده');await submit('بستن پرونده');await expect(page.getByText('بسته‌شده',{exact:true}).first()).toBeVisible();
 await page.goto('/hemo/hv/reports');await begin('مشاهده گزارش');await expect(page.getByText('آمار این گزارش در زمان ایجاد ثابت شده است؛ تغییر پرونده‌های بعدی آن را بازنویسی نمی‌کند.',{exact:true})).toBeVisible();expect(archive.summary.closed).toBe(0);
});
