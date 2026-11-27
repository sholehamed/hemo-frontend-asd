import { HemoRelatedLinksComponent,RelatedLink } from '../../shared/components/hemo-related-links.component';
import { Component,OnInit,OnDestroy,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { TransferPageAccess } from './transfer-page-access';
import { Subscription } from 'rxjs';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv,maskFor } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { bankDateTime } from '../blood-bank/bank-time';
import { TransferDetail,TransferAction,VitalPhase,STATUSES,ACTIONS,PHASES,CHECKS,allowedActions,allowedPhases,codeMatches,statusClass } from './transfer-model';
import {measuredFields,measuredUtc} from './transfer-time';
const emptyAction=()=>({unitCode:'',wristbandCode:'',notes:'',temperature:null as number|null,condition:'',receiverName:'',needleReference:'',suspectedReaction:false,volumeMl:null as number|null});
const emptyVital=()=>({phase:'' as VitalPhase|'',systolic:null as number|null,diastolic:null as number|null,pulse:null as number|null,temperature:null as number|null,spo2:null as number|null,respiration:null as number|null,urineMl:null as number|null,rateMlPerHour:null as number|null,notes:''});
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,TransfusionService,TransferPageAccess],imports:[HemoRelatedLinksComponent,FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-detail.component.html',styleUrl:'./transfer-detail.component.css'})
export class TransferDetailComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(TransferPageAccess);private api=inject(TransfusionService);private route=inject(ActivatedRoute);
 private guid='';readonly detail=signal<TransferDetail|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly action=signal<TransferAction|null>(null);readonly actions=computed(()=>{const d=this.detail();return d?allowedActions(d,this.auth.transferCapabilities()):[];});
 readonly phases=computed(()=>{const d=this.detail();if(!d||!this.auth.transferCan('vital'))return [];return allowedPhases(d.transfer.status).filter(p=>!['Post1h','Post2h'].includes(p)||!!d.transfer.endedAt);});
 readonly labels=STATUSES;readonly actionLabels=ACTIONS;readonly phaseLabels=PHASES;readonly checks=CHECKS;readonly color=statusClass;readonly fa=fa;readonly product=productLabel;readonly date=bankDateTime;
 readonly formChecks=['Receive','Verify','Witness','Start'];readonly unitOnly=['ReceiptHold','Return','AcceptReturn','Dispose'];readonly conditionActions=['ReceiptHold','Return','AcceptReturn'];
 readonly measures:{key:'systolic'|'diastolic'|'pulse'|'temperature'|'spo2'|'respiration'|'urineMl'|'rateMlPerHour';label:string;optional?:boolean;step:string}[]=[
 {key:'systolic',label:'فشار سیستولیک (mmHg)',step:'1'},{key:'diastolic',label:'فشار دیاستولیک (mmHg)',step:'1'},{key:'pulse',label:'نبض (bpm)',step:'1'},{key:'temperature',label:'دمای بدن (°C)',step:'0.01'},{key:'spo2',label:'SpO₂ (%)',step:'1'},{key:'respiration',label:'تنفس (در دقیقه)',step:'1'},{key:'urineMl',label:'دیورز (mL)',optional:true,step:'0.01'},{key:'rateMlPerHour',label:'سرعت مشاهده‌شده (mL/h)',optional:true,step:'0.01'}];
 flags=this.checks.map(()=>false);form=emptyAction();vital=emptyVital();measured=measuredFields();useNow=true;actual=measuredFields();eventNow=true;
 private seq=0;private routeSub?:Subscription;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private clearForms(){this.action.set(null);this.flags=this.checks.map(()=>false);this.form=emptyAction();this.vital=emptyVital();this.measured=measuredFields();this.actual=measuredFields();this.useNow=this.eventNow=true;}
 async ngOnInit(){
   await this.auth.load();if(!this.auth.transferCan('detail'))return;
   this.routeSub=this.route.paramMap.subscribe(p=>{
     ++this.seq;this.guid=p.get('guid')??'';this.detail.set(null);this.clearForms();this.success.set(null);this.error.set(null);this.saving.set(false);this.busy.set(false);
     if(this.guid)void this.load();
   });
 }
 ngOnDestroy(){this.routeSub?.unsubscribe();this.scope.invalidate();++this.seq;this.detail.set(null);this.clearForms();this.success.set(null);}
 async load(){
   if(!this.auth.transferCan('detail')||!this.guid||this.saving())return;
   const seq=++this.seq,guid=this.guid;this.detail.set(null);this.clearForms();this.busy.set(true);this.error.set(null);
   try{const d=await this.api.detail(guid);if(!this.current(seq))return;
     if(d.transfer.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه حواله مطابقت ندارد.');
     this.detail.set(d);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 select(a:TransferAction){
   const d=this.detail();if(!d||!this.auth.transferCan('detail')||this.busy()||this.saving()||!allowedActions(d,this.auth.transferCapabilities()).includes(a))return;
   this.action.set(a);this.flags=this.checks.map(()=>false);this.form=emptyAction();this.actual=measuredFields();this.eventNow=true;this.error.set(null);this.success.set(null);
 }
 async apply(){const d=this.detail(),a=this.action(),v=this.form;if(!d||!a||!this.auth.transferCan('detail')||this.busy()||this.saving()||!allowedActions(d,this.auth.transferCapabilities()).includes(a))return;const seq=this.seq;this.error.set(null);this.success.set(null);
 try{
  if(!v.notes.trim())throw new Error('شرح مستند عملیات الزامی است.');
  if(this.formChecks.includes(a)&&(!codeMatches(v.unitCode,v.wristbandCode,d.transfer.unitCode,d.wristbandCode)||maskFor(this.flags)!==31))throw new Error('شناسه‌های مشاهده‌شده و چک‌لیست کامل باید منطبق باشند.');
  if(this.unitOnly.includes(a)&&(!v.unitCode.trim()||a!=='ReceiptHold'&&v.unitCode.trim()!==d.transfer.unitCode))throw new Error('کد مشاهده‌شده واحد را بررسی کنید.');
  if(a==='Receive'&&(!v.receiverName.trim()||v.temperature===null||!Number.isFinite(v.temperature)||v.condition!=='Acceptable'))throw new Error('نام دریافت‌کننده، دمای ثبت‌شده و ارزیابی منطبق لازم است.');
  if(this.conditionActions.includes(a)&&(!v.receiverName.trim()||!v.condition.trim()||a==='ReceiptHold'&&v.condition==='Acceptable'))throw new Error('وضعیت واحد و نام فرد مرتبط را ثبت کنید.');
  if(a==='AcceptReturn'&&(v.temperature===null||!Number.isFinite(v.temperature)))throw new Error('دمای اندازه‌گیری‌شده هنگام برگشت لازم است.');
  if(a==='Start'&&(!d.vitals.some(x=>x.phase==='T0')||!v.needleReference.trim()))throw new Error('پایش اولیه و مشخصات وسیله ثبت‌شده لازم است.');
  if(a==='Complete'&&!d.vitals.some(x=>x.phase==='End'))throw new Error('ابتدا مشاهده پایان را ثبت کنید.');
  if(!window.confirm(this.actionLabels[a]+' به عنوان رویداد واقعی ثبت شود؟'))return;
  this.saving.set(true);await this.api.action(a,{...v,guid:d.transfer.guid,version:d.transfer.version,checks:maskFor(this.flags),occurredAt:this.eventNow?null:measuredUtc(this.actual.date,this.actual.time)});if(!this.current(seq))return;this.saving.set(false);this.clearForms();const refresh=this.load();const reloadSeq=this.seq;await refresh;if(this.current(reloadSeq))this.success.set('عملیات ثبت شد: '+this.actionLabels[a]);
 }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}
 }
 async saveVital(){const d=this.detail(),v=this.vital;if(!d||!v.phase||!this.auth.transferCan('detail')||!this.auth.transferCan('vital')||this.busy()||this.saving()||!this.phases().includes(v.phase))return;const seq=this.seq;this.error.set(null);this.success.set(null);try{
 const {systolic,diastolic,pulse,temperature,spo2,respiration}=v;
 if([systolic,diastolic,pulse,temperature,spo2,respiration].some(x=>x===null||!Number.isFinite(x)))throw new Error('تمام اندازه‌گیری‌های الزامی را وارد کنید.');
 const measuredAt=this.useNow?new Date().toISOString():measuredUtc(this.measured.date,this.measured.time);
 this.saving.set(true);await this.api.vital({guid:d.transfer.guid,version:d.transfer.version,phase:v.phase,measuredAt,systolic:systolic!,diastolic:diastolic!,pulse:pulse!,temperature:temperature!,spo2:spo2!,respiration:respiration!,urineMl:v.urineMl,rateMlPerHour:v.rateMlPerHour,notes:v.notes||null});
 if(!this.current(seq))return;this.saving.set(false);this.clearForms();const refresh=this.load();const reloadSeq=this.seq;await refresh;if(this.current(reloadSeq))this.success.set('پایش علائم ثبت شد.');
 }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}}
 eventLabel(s:string){return s==='ReactionReport'?'ثبت گزارش واکنش':s==='Dispatch'?'صدور و ارسال':s==='Vital'?'ثبت پایش':ACTIONS[s as TransferAction]??s;}
 status(s:string){return STATUSES[s as keyof typeof STATUSES]??s;}
 evidence(raw:string|null){if(!raw)return '';try{const v=JSON.parse(raw) as Record<string,unknown>;const labels:Record<string,string>={UnitCode:'کد واحد مشاهده‌شده',WristbandCode:'مچ‌بند مشاهده‌شده',Checks:'چک‌لیست',Temperature:'دما',Condition:'وضعیت',ReceiverName:'فرد مرتبط',NeedleReference:'وسیله',SuspectedReaction:'نگرانی',CarrierName:'حامل',CarrierCode:'کد حامل',ContainerCode:'ظرف',TransportIndicator:'نشانگر',PackCount:'تعداد آیس‌پک',Phase:'نوبت',MeasuredAt:'زمان اندازه‌گیری',ActualOccurredAt:'زمان واقعی واقعه',VolumeMl:'حجم مشاهده‌شده'};
 return Object.entries(v).filter(([k,x])=>k in labels&&x!==null&&x!==''&&x!==false).map(([k,x])=>labels[k]+': '+(typeof x==='boolean'?'ثبت شده':String(x))).join(' | ');
 }catch{return raw;}}
 exportVitals(){const d=this.detail();if(d&&this.auth.transferCan('detail')&&!this.busy()&&!this.saving())downloadCsv('hemo-vitals-'+d.transfer.unitCode+'.csv',[['حواله','نوبت','زمان','سیستولیک','دیاستولیک','نبض','دما','SpO2','تنفس','دیورز','سرعت ثبت‌شده','یادداشت'],...d.vitals.map(v=>[d.transfer.transferNumber,PHASES[v.phase],bankDateTime(v.measuredAt),v.systolic,v.diastolic,v.pulse,v.temperature,v.spo2,v.respiration,v.urineMl,v.rateMlPerHour,v.notes])]);}
 exportEvents(){const d=this.detail();if(d&&this.auth.transferCan('detail')&&!this.busy()&&!this.saving())downloadCsv('hemo-transfer-events-'+d.transfer.unitCode+'.csv',[['زمان','رویداد','وضعیت','شناسه کاربر','شرح','شواهد'],...d.events.map(e=>[bankDateTime(e.occurredAt),this.eventLabel(e.action),this.status(e.newStatus),e.actorUserGuid,e.notes,this.evidence(e.evidenceJson)])]);}
 print(){if(this.auth.transferCan('detail')&&this.detail()&&!this.busy()&&!this.saving())window.print();}

 readonly relatedLinks=computed(()=>{const item=this.detail();return item?this.related(item):[];});
 related(d:TransferDetail):RelatedLink[]{
   return [
     {label:'پرونده پذیرش',pattern:'/admission/detail/:guid',commands:['/admission/detail',d.transfer.admissionGuid]},
     {label:'جزئیات درخواست',pattern:'/hemo/requests/detail/:guid',commands:['/hemo/requests/detail',d.transfer.requestGuid]},
     {label:'جزئیات درخواست در بانک خون',pattern:'/hemo/requests/bank/:guid',commands:['/hemo/requests/bank',d.transfer.requestGuid]},
     {label:'گردش واحد بانک خون',pattern:'/hemo/bank/unit/:guid',commands:['/hemo/bank/unit',d.transfer.unitGuid]},
     {label:'سوابق حواله‌های درخواست',pattern:'/hemo/transfusion/records',commands:['/hemo/transfusion/records'],query:{request:d.transfer.requestGuid}},
     {label:'پرونده‌های واکنش مرتبط',pattern:'/hemo/hv/cases',commands:['/hemo/hv/cases'],query:{transfer:d.transfer.guid}}
   ];
 }
}
