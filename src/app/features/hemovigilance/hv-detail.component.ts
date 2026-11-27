import {Component,OnInit,OnDestroy,inject,signal,computed} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {HvPageAccess} from './hv-page-access';
import {HemoRelatedLinksComponent,RelatedLink} from '../../shared/components/hemo-related-links.component';
import {Subscription} from 'rxjs';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {bankDateTime,toUtc} from '../blood-bank/bank-time';
import {productLabel} from '../blood-requests/blood-request-model';
import {measuredFields,measuredUtc} from '../transfusion/transfer-time';
import {PHASES,STATUSES as TX_STATUS} from '../transfusion/transfer-model';
import {HvDetail,CapaView,ReviewAction,CapaAction,ReviewInput,Owner,STATUS,REVIEW,SYMPTOMS,DIAGNOSES,SEVERITIES,IMPUTABILITIES,OUTCOMES,EXTERNAL,METHODS,CAPA_STATUS,CAPA_KINDS,reviewActions,capaActions,closeReady,statusColor} from './hv-model';
const emptyReview=()=>({notes:'',diagnosisCode:'',severity:'',imputability:'',outcome:'',actions:'',labRequest:'',recommendations:'',doctorReference:'',sampleReference:'',reportReference:'',disposition:'',rcaRequired:null as boolean|null,externalStatus:'',externalReference:'',rcaLead:'',rcaMethod:'',participants:'',directCause:'',rootCause:''});
const emptyAssign=()=>({title:'',kind:'',ownerUserGuid:'',dueDate:'',indicator:''});
const CAPA_LABELS:Record<CapaAction,string>={CapaProgress:'ثبت پیشرفت / ارسال برای بازبینی',CapaVerify:'تأیید مستقل اثربخشی',CapaReject:'رد و بازگشت برای اصلاح'};
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,HemovigilanceService,HvPageAccess],imports:[HemoRelatedLinksComponent,FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./hv-detail.component.html',styleUrl:'./hv-detail.component.css'})
export class HvDetailComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(HvPageAccess);private api=inject(HemovigilanceService);private route=inject(ActivatedRoute);
 private guid='';readonly detail=signal<HvDetail|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly action=signal<ReviewAction|null>(null);readonly actions=computed(()=>{const d=this.detail();return d?reviewActions(d,this.auth.hvCapabilities()):[];});
 readonly assigning=signal(false);readonly owners=signal<Owner[]>([]);readonly selectedCapa=signal<{guid:string;action:CapaAction}|null>(null);
 readonly statuses=STATUS;readonly reviewLabels=REVIEW;readonly symptoms=SYMPTOMS;readonly diagnoses=DIAGNOSES;readonly severities=SEVERITIES;readonly imputabilities=IMPUTABILITIES;readonly outcomes=OUTCOMES;readonly external=EXTERNAL;readonly methods=METHODS;readonly capaStatus=CAPA_STATUS;readonly kinds=CAPA_KINDS;readonly capaLabels=CAPA_LABELS;readonly phases=PHASES;
 readonly options={diagnosis:Object.entries(DIAGNOSES),severity:Object.entries(SEVERITIES),imputability:Object.entries(IMPUTABILITIES),outcome:Object.entries(OUTCOMES),external:Object.entries(EXTERNAL).filter(([k])=>k!=='NotRecorded'),methods:Object.entries(METHODS),kinds:Object.entries(CAPA_KINDS)};
 readonly fa=fa;readonly product=productLabel;readonly date=bankDateTime;readonly color=statusColor;readonly closeReady=closeReady;
 readonly canAssign=computed(()=>{const d=this.detail();return !!d&&['RcaOpen','CapaMonitoring'].includes(d.case.status)&&this.auth.hvCan('assignCapa')&&this.auth.hvCan('owners');});
 form=emptyReview();meeting=measuredFields();assign=emptyAssign();progress={percent:0,evidence:''};
 private seq=0;private params?:Subscription;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private clearForms(){this.action.set(null);this.assigning.set(false);this.selectedCapa.set(null);this.owners.set([]);this.form=emptyReview();this.meeting=measuredFields();this.assign=emptyAssign();this.progress={percent:0,evidence:''};}
 async ngOnInit(){await this.auth.load();if(!this.auth.hvCan('detail'))return;
   this.params=this.route.paramMap.subscribe(p=>{++this.seq;this.guid=p.get('guid')??'';this.detail.set(null);this.clearForms();this.success.set(null);this.error.set(null);this.busy.set(false);this.saving.set(false);if(this.guid)void this.load();});
 }
 ngOnDestroy(){this.params?.unsubscribe();this.scope.invalidate();++this.seq;this.detail.set(null);this.clearForms();this.success.set(null);}
 async load(){
   if(!this.auth.hvCan('detail')||!this.guid||this.saving())return;
   const seq=++this.seq,guid=this.guid;this.detail.set(null);this.clearForms();this.busy.set(true);this.error.set(null);
   try{const d=await this.api.detail(guid);if(!this.current(seq))return;if(d.case.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه پرونده مطابقت ندارد.');this.detail.set(d);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 select(a:ReviewAction){const d=this.detail();if(!d||!this.auth.hvCan('detail')||this.busy()||this.saving()||!reviewActions(d,this.auth.hvCapabilities()).includes(a))return;this.clearForms();this.action.set(a);this.error.set(null);this.success.set(null);}
 private async refreshAfterWrite(seq:number,notice:string){if(!this.current(seq))return;this.saving.set(false);const refresh=this.load();const reloadSeq=this.seq;await refresh;if(this.current(reloadSeq))this.success.set(notice);}
 async apply(){const d=this.detail(),a=this.action(),v=this.form;if(!d||!a||!this.auth.hvCan('detail')||this.busy()||this.saving()||!reviewActions(d,this.auth.hvCapabilities()).includes(a))return;const seq=this.seq;this.error.set(null);this.success.set(null);try{
  if(!v.notes.trim())throw new Error('شرح مستند الزامی است.');
  if(a==='DoctorReview'&&(!v.diagnosisCode||!v.severity||!v.imputability||!v.outcome||!v.actions.trim()||!v.doctorReference.trim()))throw new Error('طبقه‌بندی، پیامد، شرح اقدامات و مرجع پزشک را تکمیل کنید.');
  if(a==='BankReview'&&(!v.sampleReference.trim()||!v.reportReference.trim()||!v.disposition.trim()))throw new Error('وضعیت نمونه، مرجع گزارش و نتیجه بررسی لازم است.');
  if(a==='Investigate'&&(v.rcaRequired===null||!v.externalStatus))throw new Error('تصمیم RCA و وضعیت گزارش بیرونی را ثبت کنید.');
  if((a==='External'||a==='Investigate')&&(!v.externalStatus||v.externalStatus==='SentManually'&&!v.externalReference.trim()))throw new Error('وضعیت و مرجع واقعی گزارش بیرونی لازم است.');
  if(a==='PublishRca'&&(!v.rcaLead.trim()||!v.rcaMethod||!v.participants.trim()||!v.directCause.trim()||!v.rootCause.trim()||!d.actions.length))throw new Error('اطلاعات جلسه، علل مستند و حداقل یک CAPA لازم است.');
  if(a==='Close'&&!closeReady(d))throw new Error('شرایط بسته شدن پرونده هنوز کامل نیست.');
  const input:ReviewInput={guid:d.case.guid,version:d.case.version,...v,meetingAt:a==='PublishRca'?measuredUtc(this.meeting.date,this.meeting.time):null};
  if(!window.confirm(REVIEW[a]+' ثبت شود؟'))return;this.saving.set(true);await this.api.review(a,input);await this.refreshAfterWrite(seq,'عملیات ثبت شد: '+REVIEW[a]);
 }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}}
 async openAssign(){
   if(!this.canAssign()||!this.auth.hvCan('detail')||this.busy()||this.saving())return;
   const seq=this.seq;this.clearForms();this.error.set(null);this.success.set(null);this.busy.set(true);
   try{const owners=await this.api.owners();if(this.current(seq)){this.owners.set(owners);this.assigning.set(true);}}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async saveAssign(){
   const d=this.detail(),v=this.assign;if(!d||!this.auth.hvCan('detail')||!this.canAssign()||!this.assigning()||this.busy()||this.saving())return;
   const seq=this.seq;this.error.set(null);this.success.set(null);
   try{
     if(!v.title.trim()||!Object.prototype.hasOwnProperty.call(CAPA_KINDS,v.kind)||!this.owners().some(o=>o.userGuid===v.ownerUserGuid)||!v.indicator.trim()||!v.dueDate)throw new Error('شرح، نوع، مسئول، موعد و شاخص اقدام لازم است.');
     const dueAt=new Date(Date.parse(toUtc(v.dueDate,'23:59'))+59999).toISOString();
     if(!window.confirm('تخصیص اقدام ثبت شود؟'))return;
     this.saving.set(true);await this.api.assign({guid:d.case.guid,version:d.case.version,title:v.title,kind:v.kind,ownerUserGuid:v.ownerUserGuid,dueAt,indicator:v.indicator});await this.refreshAfterWrite(seq,'اقدام اصلاحی / پیشگیرانه ثبت شد.');
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}
 }
 availableCapa(c:CapaView){const d=this.detail();const item=d?.actions.find(x=>x.guid===c.guid&&x.version===c.version);return d&&item&&this.auth.hvCan('detail')?capaActions(d,item,this.auth.hvCapabilities()):[];}
 chooseCapa(c:CapaView,a:CapaAction){if(this.busy()||this.saving()||!this.availableCapa(c).includes(a))return;this.clearForms();this.selectedCapa.set({guid:c.guid,action:a});this.progress={percent:c.progress,evidence:''};this.error.set(null);this.success.set(null);}
 async saveCapa(c:CapaView,a:CapaAction){
   const d=this.detail(),sel=this.selectedCapa();if(!d||!sel||sel.guid!==c.guid||sel.action!==a||this.busy()||this.saving()||!this.availableCapa(c).includes(a))return;
   const item=d.actions.find(x=>x.guid===c.guid&&x.version===c.version)!;const seq=this.seq;this.error.set(null);this.success.set(null);
   try{
     const percent=a==='CapaProgress'?this.progress.percent:item.progress;
     if(!this.progress.evidence.trim()||!Number.isInteger(percent)||percent<0||percent>100)throw new Error('درصد و شواهد مستند معتبر لازم است.');
     if(!window.confirm(CAPA_LABELS[a]+' ثبت شود؟'))return;
     this.saving.set(true);await this.api.capa(a,{guid:item.guid,version:item.version,caseVersion:d.case.version,progress:percent,evidence:this.progress.evidence});await this.refreshAfterWrite(seq,'پیگیری اقدام ثبت شد.');
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}
 }
 readonly relatedLinks=computed<RelatedLink[]>(()=>{const d=this.detail();return d?[{label:'پرونده حواله و ثبت توقف',pattern:'/hemo/transfusion/detail/:guid',commands:['/hemo/transfusion/detail',d.case.transferGuid]}]:[];});
 eventLabel(s:string){return (REVIEW as Record<string,string>)[s]??(CAPA_LABELS as Record<string,string>)[s]??({Report:'گزارش اولیه',AssignCapa:'تخصیص اقدام'} as Record<string,string>)[s]??s;}
 status(s:string){return (STATUS as Record<string,string>)[s]??s;}
 txStatus(s:string){return (TX_STATUS as Record<string,string>)[s]??s;}
 evidence(raw:string|null){if(!raw)return '';try{const v=JSON.parse(raw) as Record<string,unknown>;const labels:Record<string,string>={DiagnosisCode:'تشخیص',Severity:'شدت',Imputability:'ارتباط علّی',Outcome:'پیامد',Actions:'اقدامات',LabRequest:'آزمایش درخواستی',Recommendations:'توصیه ثبت‌شده',DoctorReference:'مرجع پزشک',SampleReference:'نمونه',ReportReference:'مرجع بانک',Disposition:'نتیجه بانک',RcaRequired:'نیاز RCA',ExternalStatus:'وضعیت گزارش',ExternalReference:'مرجع خارجی',RcaLead:'رهبر',RcaMethod:'روش',MeetingAt:'زمان جلسه',Participants:'اعضا',DirectCause:'علت مستقیم',RootCause:'علت ریشه‌ای',Indicator:'شاخص',Kind:'نوع',DueAt:'موعد',Previous:'قبلی',Current:'جدید',Progress:'پیشرفت',Symptoms:'نشانه‌ها',InitialSeverity:'درجه اولیه',ActionsTaken:'اقدامات اولیه',SamplesSent:'نمونه‌ها',VolumeMl:'حجم',OnsetAt:'زمان بروز'};
  return Object.entries(v).filter(([k,x])=>k in labels&&x!==null&&x!=='').map(([k,x])=>labels[k]+': '+(typeof x==='boolean'?(x?'بله':'خیر'):Array.isArray(x)?x.join('، '):String(x))).join(' | ');
 }catch{return raw;}}
 exportActions(){const d=this.detail();if(d&&this.auth.hvCan('detail')&&!this.busy()&&!this.saving())downloadCsv('hemo-capa-'+d.case.caseNumber+'.csv',[['پرونده','شرح','نوع','مسئول','موعد','شاخص','وضعیت','پیشرفت','شواهد','نظر بازبین'],...d.actions.map(a=>[d.case.caseNumber,a.title,CAPA_KINDS[a.kind],a.ownerName,bankDateTime(a.dueAt),a.indicator,CAPA_STATUS[a.status],a.progress,a.evidence,a.verificationNotes])]);}
 exportEvents(){const d=this.detail();if(d&&this.auth.hvCan('detail')&&!this.busy()&&!this.saving())downloadCsv('hemo-hv-history-'+d.case.caseNumber+'.csv',[['زمان','عملیات','وضعیت','کاربر','شرح','جزئیات'],...d.events.map(e=>[bankDateTime(e.occurredAt),this.eventLabel(e.action),this.status(e.newStatus),e.actorUserGuid,e.notes,this.evidence(e.evidenceJson)])]);}
 print(){if(this.auth.hvCan('detail')&&this.detail()&&!this.busy()&&!this.saving())window.print();}
}
