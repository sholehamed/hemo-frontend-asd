import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {DashboardPageAccess} from './dashboard-page-access';
import {firstValueFrom} from 'rxjs';
import {AdmissionsService} from '../../core/api/admissions.service';
import {BloodRequestsService} from '../../core/api/blood-requests.service';
import {BloodBankService} from '../../core/api/blood-bank.service';
import {TransfusionService} from '../../core/api/transfusion.service';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,downloadCsv} from '../../shared/admission-utils';
import {isoToJalali} from '../../shared/jalali-date';
import {DashboardLink,DashboardSection,Metric,Trend,metric,link,loadSection,fullWeeks,bar} from './dashboard-model';

@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,DashboardPageAccess,AdmissionsService,BloodRequestsService,BloodBankService,TransfusionService,HemovigilanceService,QualityService],imports:[RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./home.component.html',styleUrl:'./home.component.css'})
export class HomeComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(DashboardPageAccess);private http=inject(HemoCompanyHttp);
 private admission=inject(AdmissionsService);private requests=inject(BloodRequestsService);private bank=inject(BloodBankService);
 private tx=inject(TransfusionService);private hv=inject(HemovigilanceService);private quality=inject(QualityService);
 readonly sections=signal<DashboardSection[]>([]);readonly busy=signal(false);readonly updated=signal<Date|null>(null);
 readonly trends=signal<Trend[]>([]);readonly trendErrors=signal<string[]>([]);readonly trendBusy=signal(false);readonly trendRange=signal('');
 readonly fa=fa;readonly bar=bar;
 readonly checkingLinks=signal(false);readonly checkedLinks=signal(false);private permitted=signal<ReadonlySet<string>>(new Set());private generation=0;
 private current(g:number){return this.scope.isCurrent()&&g===this.generation;}
 canNavigate(path:string){return this.scope.isCurrent()&&this.permitted().has(path);}
 ngOnInit(){void this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.generation;this.sections.set([]);this.trends.set([]);this.trendErrors.set([]);this.updated.set(null);this.permitted.set(new Set());}
 async checkLinks(){
   if(!this.scope.isCurrent()||this.busy()||this.checkingLinks())return;
   const g=this.generation,paths=[...new Set([...this.quickLinks(),...this.sections().flatMap(s=>[...s.links,...s.metrics.flatMap(m=>m.link?[m.link]:[])])].map(l=>l.path))];
   this.permitted.set(new Set());this.checkedLinks.set(false);this.checkingLinks.set(true);
   try{const allowed=await Promise.all(paths.map(async path=>{try{return await firstValueFrom(this.http.post<boolean>('/Identity/RoleAccess/CheckPagePermission',{Menu:path}))===true?path:null;}catch{return null;}}));
     if(this.current(g)){this.permitted.set(new Set(allowed.filter((x):x is string=>x!==null)));this.checkedLinks.set(true);}
   }finally{if(this.current(g))this.checkingLinks.set(false);}
 }
 visibleQuickLinks(){return this.quickLinks().filter(l=>this.canNavigate(l.path));}
 quickLinks():DashboardLink[]{
  const a=this.auth, links:DashboardLink[]=[];
  const add=(allowed:boolean,label:string,path:string,query?:Record<string,string>)=>{if(allowed)links.push(link(label,path,query));};
  add(a.can('create')&&a.can('find')&&a.can('detail'),'پذیرش جدید','/admission/new');
  add(a.can('review')&&a.can('detail')&&a.can('list')&&a.can('reviews'),'تطبیق هویت','/admission/identity');
  add(a.can('review')&&a.can('detail')&&a.can('list')&&a.can('reviews'),'کنترل ترخیص','/admission/discharge');
  add(a.requestCan('nurseCreate')&&a.requestCan('detail')&&a.can('detail')&&a.can('list'),'درخواست پرستاری','/hemo/requests/new');
  add(a.requestCan('doctorCreate')&&a.requestCan('detail')&&a.can('detail')&&a.can('list'),'ثبت دستور پزشک','/hemo/requests/orders');
  add(a.requestCan('decide')&&a.requestCan('list'),'کارتابل تأیید پزشک','/hemo/requests/approval');
  add(a.requestCan('bankQueue'),'صف بانک خون','/hemo/requests/bank');
  add(a.bankCan('receive'),'دریافت فرآورده','/hemo/bank/receive');
  add(a.bankCan('inventory')&&a.bankCan('test')&&a.requestCan('bankQueue')&&a.requestCan('bankDetail'),'آزمایش سازگاری','/hemo/bank/crossmatch');
  add(a.transferCan('candidates')&&a.transferCan('dispatch')&&a.transferCan('detail'),'صدور حواله','/hemo/transfusion/dispatch');
  add(a.transferCan('list')&&a.transferCan('receive'),'دریافت و تطبیق','/hemo/transfusion/tasks',{status:'Dispatched'});
  add(a.transferCan('list')&&a.transferCan('witness'),'صف تطبیق دوم','/hemo/transfusion/tasks',{status:'Verified'});
  add(a.transferCan('list')&&a.transferCan('vital'),'پایش علائم حیاتی','/hemo/transfusion/vitals');
  add(a.transferCan('list')&&a.transferCan('doctorNote'),'پایش پزشک','/hemo/transfusion/monitoring');
  add(a.hvCan('report')&&a.hvCan('candidates')&&a.hvCan('detail'),'گزارش واکنش','/hemo/hv/new');
  add(a.hvCan('doctorReview')&&a.hvCan('list'),'بررسی واکنش پزشک','/hemo/hv/doctor');
  add(a.hvCan('bankReview')&&a.hvCan('list'),'بررسی واکنش بانک','/hemo/hv/bank');
  add((a.hvCan('investigate')||a.hvCan('publishRca'))&&a.hvCan('list'),'تحلیل RCA','/hemo/hv/rca');
  add(a.hvCan('close')&&a.hvCan('list'),'بازبینی نهایی واکنش','/hemo/hv/cases',{status:'ReadyToClose'});
  add(a.hvCan('list')&&(a.hvCan('capaProgress')||a.hvCan('capaVerify')||a.hvCan('assignCapa')||a.hvCan('close')),'اقدامات CAPA','/hemo/hv/capa');
  add(a.qualityCan('equipmentList')&&a.qualityCan('equipmentService'),'سرویس و کالیبراسیون','/hemo/quality/maintenance');
  add(a.qualityCan('incidents'),'حوادث تجهیزات','/hemo/quality/incidents');
  add(a.qualityCan('qcList'),'کنترل کیفیت','/hemo/quality/qc');
  add(a.qualityCan('committeeList'),'کمیته و مصوبات','/hemo/quality/committee');
  add(a.qualityCan('auditList'),'ممیزی','/hemo/quality/audit');
  add(a.qualityCan('trainingList'),'آموزش','/hemo/quality/training');
  add(a.can('stats'),'گزارش پذیرش','/admission/stats');
  add(a.bankCan('stats'),'گزارش بانک خون','/hemo/bank/reports');
  add(a.hvCan('reports')&&a.hvCan('reportDetail'),'آرشیو گزارش واکنش','/hemo/hv/reports');
  add(a.qualityCan('stats'),'گزارش مدیریتی','/hemo/quality');
  return links;
 }
 async load(){
  if(!this.scope.isCurrent()||this.busy())return;const g=++this.generation;this.busy.set(true);this.sections.set([]);this.updated.set(null);this.permitted.set(new Set());this.checkedLinks.set(false);this.checkingLinks.set(false);this.trends.set([]);this.trendErrors.set([]);this.trendRange.set('');this.trendBusy.set(false);
  await this.auth.load();if(!this.current(g))return;
  const a=this.auth, tasks:Promise<DashboardSection>[]=[];
  const add=(id:string,title:string,description:string,links:DashboardLink[],read:()=>Promise<Metric[]>)=>tasks.push(loadSection(id,title,description,links,read));
  const go=(allowed:boolean,path:string,query?:Record<string,string>)=>allowed?link(query?'مشاهده رکوردها':'مشاهده گزارش یا کارتابل',path,query):undefined;
  const links=(...items:(DashboardLink|undefined)[])=>items.filter((x):x is DashboardLink=>!!x);
  if(a.can('stats'))add('admission','پذیرش و ایمنی هویت','کل پرونده‌های قابل مشاهده در مرکز جاری',links(go(true,'/admission/stats'),go(a.can('list'),'/admission/list')),async()=>{
   const s=await this.admission.stats(),l=a.can('list');
   return [metric('کل پذیرش‌ها',s.total,go(l,'/admission/list')),metric('بستری فعال',s.active,go(l,'/admission/list',{status:'Active'})),metric('هویت تأیید شده',s.verified,go(l,'/admission/list',{identity:'Verified'})),metric('مغایرت هویت',s.mismatch,go(l,'/admission/list',{identity:'Mismatch'}),true),metric('آماده بررسی ترخیص',s.ready,go(l,'/admission/list',{status:'ReadyForDischarge'}))];
  });
  const mine=a.requestCan('nurseCreate')&&!a.requestCan('decide');
  if(a.requestCan('stats'))add('requests',mine?'درخواست‌های ثبت‌شده توسط من':'درخواست‌های فرآورده',mine?'محدود به درخواست‌های خود کاربر':'شمارش در محدوده مجاز نقش',links(go(a.requestCan('list'),'/hemo/requests',mine?{mine:'true'}:undefined)),async()=>{
   const s=await this.requests.stats(mine);const r=(status:string)=>go(a.requestCan('list'),'/hemo/requests',{status,...(mine?{mine:'true'}:{})});
   return [metric('کل درخواست‌ها',s.total),metric('پیش‌نویس',s.draft,r('Draft')),metric('در انتظار پزشک',s.awaitingDoctor,r('AwaitingDoctor'),true),metric('برگشت برای اصلاح',s.returned,r('Returned'),true),metric('تأیید و ارجاع بانک',s.awaitingBank,r('AwaitingBank')),metric('ردشده',s.rejected,r('Rejected')),metric('لغوشده',s.cancelled,r('Cancelled'))];
  });
  if(a.bankCan('stats'))add('bank','موجودی بانک خون','وضعیت ثبت‌شده واحدها؛ بدون پیش‌بینی یا توصیه بالینی',links(go(true,'/hemo/bank/reports')),async()=>{
   const s=await this.bank.stats(),r=(status:string)=>go(a.bankCan('inventory'),'/hemo/bank/inventory',{status});
   return [metric('آزاد',s.available),metric('رزروشده',s.reserved),metric('آماده بررسی تحویل',s.ready),metric('نزدیک انقضا',s.expiringSoon,r('ExpiringSoon'),true),metric('منقضی',s.expired,r('Expired'),true),metric('نگرانی دما در ۲۴ ساعت',s.temperatureConcerns,undefined,true),metric('قرنطینه / انتظار بازرسی',s.hold,undefined,true),...(s.equipmentBlocked===undefined?[]:[metric('مسدود فنی تجهیز',s.equipmentBlocked,undefined,true)])];
  });
  if(a.transferCan('stats'))add('transfer','تحویل و تزریق','شمارش وضعیت حواله‌های قابل مشاهده؛ نه وظایف شخصی',links(go(a.transferCan('list'),'/hemo/transfusion')),async()=>{
   const s=await this.tx.stats(),r=(status:string)=>go(a.transferCan('list'),'/hemo/transfusion/tasks',{status});
   return [metric('در مسیر بخش',s.dispatched,r('Dispatched')),metric('دریافت شده',s.received,r('Received')),metric('در انتظار تطبیق دوم',s.verified,r('Verified')),metric('در حال تزریق',s.inProgress,r('InProgress')),metric('پایان ثبت‌شده',s.completed,r('Completed')),metric('مغایرت دریافت',s.receiptHold,r('ReceiptHold'),true),metric('توقف ثبت‌شده',s.stopped,r('Stopped'),true),metric('در مسیر برگشت',s.returning,r('Returning'),true)];
  });
  if(a.hvCan('stats'))add('hv','واکنش و هموویژیلانس','پرونده‌ها و پیگیری ثبت‌شده؛ بدون استنباط نرخ واکنش',links(go(a.hvCan('list'),'/hemo/hv')),async()=>{
   const s=await this.hv.stats(),r=(status:string)=>go(a.hvCan('list'),'/hemo/hv/cases',{status});
   return [metric('پرونده باز',s.open,r('Open'),true),metric('در انتظار پزشک',s.pendingDoctor,r('Reported'),true),metric('در انتظار بانک',s.pendingBank,r('DoctorReviewed'),true),metric('RCA باز',s.rcaOpen,r('RcaOpen'),true),metric('CAPA باز',s.capaOpen,undefined,true),metric('CAPA سررسید گذشته',s.capaOverdue,undefined,true),metric('گزارش بیرونی موردنیاز',s.externalPending,undefined,true)];
  });
  if(a.qualityCan('equipmentStats'))add('equipment','تجهیزات و زنجیره سرما','وضعیت ثبت‌شده تجهیزات؛ پایش زنده حسگر نیست',links(go(true,'/hemo/quality/equipment-dashboard')),async()=>{
   const s=await this.quality.equipmentStats(),r=(status:string)=>go(a.qualityCan('equipmentList'),'/hemo/quality/equipment',{status});
   return [metric('کل تجهیزات',s.total),metric('عملیاتی',s.operational),metric('توقف فنی',s.hold,r('Hold'),true),metric('سررسید گذشته',s.serviceDue,go(a.qualityCan('equipmentList')&&a.qualityCan('equipmentService'),'/hemo/quality/maintenance'),true),metric('حادثه باز',s.openIncidents,undefined,true),metric('کد فاقد شناسنامه',s.legacyCodes,undefined,true)];
  });
  if(a.qualityCan('stats'))add('quality','مدیریت کیفیت','۳۰ روز اخیر (UTC)؛ شمارش رویدادهای ثبت‌شده، نه نرخ انطباق',links(go(true,'/hemo/quality')),async()=>{
   const to=new Date(),from=new Date(to.getTime()-30*86400000),s=await this.quality.stats({from:from.toISOString(),to:to.toISOString()});
   return [metric('کنترل کیفیت',s.qcRecords),metric('QC در انتظار بازبینی',s.qcAwaitingReview,undefined,true),metric('جلسه کمیته',s.committeeMeetings),metric('مصوبه باز',s.openResolutions,undefined,true),metric('مصوبه معوق',s.overdueResolutions,undefined,true),metric('ممیزی',s.audits),metric('دوره آموزش',s.trainingCourses),metric('پایان تزریق ثبت‌شده',s.products.reduce((n,p)=>n+p.completed,0))];
  });
  try{const sections=await Promise.all(tasks);if(this.current(g)){this.sections.set(sections);this.updated.set(new Date());}}finally{if(this.current(g))this.busy.set(false);}
 }
 canCompare(){return this.auth.can('stats')||this.auth.hvCan('stats')||this.auth.qualityCan('stats');}
 async compare(){
  if(!this.scope.isCurrent()||this.busy()||!this.canCompare()||this.trendBusy())return;const g=this.generation;this.trendBusy.set(true);this.trends.set([]);this.trendErrors.set([]);
  const {current:c,previous:p}=fullWeeks(new Date()), tasks:Promise<Trend[]>[]=[];
  this.trendRange.set(isoToJalali(c.fromDate)+' تا '+isoToJalali(c.toDate)+' / '+isoToJalali(p.fromDate)+' تا '+isoToJalali(p.toDate));
  const add=async(name:string,read:()=>Promise<Trend[]>)=>{try{return await read();}catch{if(this.current(g))this.trendErrors.update(x=>[...x,name]);return [];}};
  if(this.auth.can('stats'))tasks.push(add('پذیرش',async()=>{const [x,y]=await Promise.all([this.admission.stats({from:c.fromDate,to:c.toDate}),this.admission.stats({from:p.fromDate,to:p.toDate})]);return [{label:'پذیرش‌ها',current:x.total,previous:y.total}];}));
  if(this.auth.hvCan('stats'))tasks.push(add('هموویژیلانس',async()=>{const [x,y]=await Promise.all([this.hv.stats({from:c.from,to:c.to}),this.hv.stats({from:p.from,to:p.to})]);return [{label:'واکنش ثبت‌شده بر اساس بروز',current:x.total,previous:y.total},{label:'تزریق شروع‌شده',current:x.startedTransfers,previous:y.startedTransfers}];}));
  if(this.auth.qualityCan('stats'))tasks.push(add('کیفیت',async()=>{const [x,y]=await Promise.all([this.quality.stats({from:c.from,to:c.to}),this.quality.stats({from:p.from,to:p.to})]);return [{label:'QC ثبت‌شده',current:x.qcRecords,previous:y.qcRecords},{label:'پایان تزریق ثبت‌شده',current:x.products.reduce((n,r)=>n+r.completed,0),previous:y.products.reduce((n,r)=>n+r.completed,0)}];}));
  try{const result=(await Promise.all(tasks)).flat();if(this.current(g))this.trends.set(result);}finally{if(this.current(g))this.trendBusy.set(false);}
 }
 export(){if(!this.scope.isCurrent()||this.busy()||this.trendBusy()||!this.sections().length)return;downloadCsv('hemo-role-dashboard.csv',[['ماژول','بازه / محدوده','شاخص','تعداد'],...this.sections().flatMap(s=>s.error?[[s.title,s.description,'آمار در دسترس نیست','']]:s.metrics.map(m=>[s.title,s.description,m.label,m.value])),['مقایسه',this.trendRange(),'شاخص','هفته اخیر کامل','هفته قبل'],...this.trends().map(t=>['مقایسه',this.trendRange(),t.label,t.current,t.previous]),...this.trendErrors().map(n=>['مقایسه',this.trendRange(),n,'در دسترس نیست','']),...this.auth.errors().map(n=>[n,'مجوز','دریافت قابلیت ناموفق',''])]);}
}
