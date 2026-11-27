import { Component,OnInit,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv,maskFor } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { bankDateTime } from '../blood-bank/bank-time';
import { TransferDetail,TransferAction,VitalPhase,STATUSES,ACTIONS,PHASES,CHECKS,allowedActions,allowedPhases,codeMatches,statusClass } from './transfer-model';
import {measuredFields,measuredUtc} from './transfer-time';
const emptyAction=()=>({unitCode:'',wristbandCode:'',notes:'',temperature:null as number|null,condition:'',receiverName:'',needleReference:'',suspectedReaction:false,volumeMl:null as number|null});
const emptyVital=()=>({phase:'' as VitalPhase|'',systolic:null as number|null,diastolic:null as number|null,pulse:null as number|null,temperature:null as number|null,spo2:null as number|null,respiration:null as number|null,urineMl:null as number|null,rateMlPerHour:null as number|null,notes:''});
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-detail.component.html',styleUrl:'./transfer-detail.component.css'})
export class TransferDetailComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(TransfusionService);private route=inject(ActivatedRoute);
 readonly guid=this.route.snapshot.paramMap.get('guid')??'';readonly detail=signal<TransferDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly action=signal<TransferAction|null>(null);readonly actions=computed(()=>{const d=this.detail();return d?allowedActions(d,this.auth.transferCapabilities()):[];});
 readonly phases=computed(()=>{const d=this.detail();if(!d||!this.auth.transferCan('vital'))return [];return allowedPhases(d.transfer.status).filter(p=>!['Post1h','Post2h'].includes(p)||!!d.transfer.endedAt);});
 readonly labels=STATUSES;readonly actionLabels=ACTIONS;readonly phaseLabels=PHASES;readonly checks=CHECKS;readonly color=statusClass;readonly fa=fa;readonly product=productLabel;readonly date=bankDateTime;
 readonly formChecks=['Receive','Verify','Witness','Start'];readonly unitOnly=['ReceiptHold','Return','AcceptReturn','Dispose'];readonly conditionActions=['ReceiptHold','Return','AcceptReturn'];
 readonly measures:{key:'systolic'|'diastolic'|'pulse'|'temperature'|'spo2'|'respiration'|'urineMl'|'rateMlPerHour';label:string;optional?:boolean;step:string}[]=[
 {key:'systolic',label:'فشار سیستولیک (mmHg)',step:'1'},{key:'diastolic',label:'فشار دیاستولیک (mmHg)',step:'1'},{key:'pulse',label:'نبض (bpm)',step:'1'},{key:'temperature',label:'دمای بدن (°C)',step:'0.01'},{key:'spo2',label:'SpO₂ (%)',step:'1'},{key:'respiration',label:'تنفس (در دقیقه)',step:'1'},{key:'urineMl',label:'دیورز (mL)',optional:true,step:'0.01'},{key:'rateMlPerHour',label:'سرعت مشاهده‌شده (mL/h)',optional:true,step:'0.01'}];
 flags=this.checks.map(()=>false);form=emptyAction();vital=emptyVital();measured=measuredFields();useNow=true;actual=measuredFields();eventNow=true;
 ngOnInit(){if(this.auth.transferCan('detail'))void this.load();}
 async load(){if(!this.auth.transferCan('detail'))return;this.busy.set(true);this.error.set(null);try{const d=await this.api.detail(this.guid);this.detail.set(d);if(this.action()&&!this.actions().includes(this.action()!))this.action.set(null);if(this.vital.phase&&!this.phases().includes(this.vital.phase))this.vital=emptyVital();}catch(e){this.detail.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 select(a:TransferAction){this.action.set(a);this.flags=this.checks.map(()=>false);this.form=emptyAction();this.actual=measuredFields();this.eventNow=true;this.error.set(null);this.success.set(null);}
 async apply(){const d=this.detail(),a=this.action(),v=this.form;if(!d||!a||this.busy()||!this.actions().includes(a))return;this.error.set(null);this.success.set(null);
 try{
  if(!v.notes.trim())throw new Error('شرح مستند عملیات الزامی است.');
  if(this.formChecks.includes(a)&&(!codeMatches(v.unitCode,v.wristbandCode,d.transfer.unitCode,d.wristbandCode)||maskFor(this.flags)!==31))throw new Error('شناسه‌های مشاهده‌شده و چک‌لیست کامل باید منطبق باشند.');
  if(this.unitOnly.includes(a)&&(!v.unitCode.trim()||a!=='ReceiptHold'&&v.unitCode.trim()!==d.transfer.unitCode))throw new Error('کد مشاهده‌شده واحد را بررسی کنید.');
  if(a==='Receive'&&(!v.receiverName.trim()||v.temperature===null||v.condition!=='Acceptable'))throw new Error('نام دریافت‌کننده، دمای ثبت‌شده و ارزیابی منطبق لازم است.');
  if(this.conditionActions.includes(a)&&(!v.receiverName.trim()||!v.condition.trim()||a==='ReceiptHold'&&v.condition==='Acceptable'))throw new Error('وضعیت واحد و نام فرد مرتبط را ثبت کنید.');
  if(a==='AcceptReturn'&&v.temperature===null)throw new Error('دمای اندازه‌گیری‌شده هنگام برگشت لازم است.');
  if(a==='Start'&&(!d.vitals.some(x=>x.phase==='T0')||!v.needleReference.trim()))throw new Error('پایش اولیه و مشخصات وسیله ثبت‌شده لازم است.');
  if(a==='Complete'&&!d.vitals.some(x=>x.phase==='End'))throw new Error('ابتدا مشاهده پایان را ثبت کنید.');
  if(!window.confirm(this.actionLabels[a]+' به عنوان رویداد واقعی ثبت شود؟'))return;
  this.busy.set(true);await this.api.action(a,{...v,guid:d.transfer.guid,version:d.transfer.version,checks:maskFor(this.flags),occurredAt:this.eventNow?null:measuredUtc(this.actual.date,this.actual.time)});this.action.set(null);this.success.set('عملیات ثبت شد: '+this.actionLabels[a]);await this.load();
 }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}
 }
 async saveVital(){const d=this.detail(),v=this.vital;if(!d||!v.phase||this.busy()||!this.phases().includes(v.phase))return;this.error.set(null);this.success.set(null);try{
 const {systolic,diastolic,pulse,temperature,spo2,respiration}=v;
 if([systolic,diastolic,pulse,temperature,spo2,respiration].some(x=>x===null||!Number.isFinite(x)))throw new Error('تمام اندازه‌گیری‌های الزامی را وارد کنید.');
 const measuredAt=this.useNow?new Date().toISOString():measuredUtc(this.measured.date,this.measured.time);
 this.busy.set(true);await this.api.vital({guid:d.transfer.guid,version:d.transfer.version,phase:v.phase,measuredAt,systolic:systolic!,diastolic:diastolic!,pulse:pulse!,temperature:temperature!,spo2:spo2!,respiration:respiration!,urineMl:v.urineMl,rateMlPerHour:v.rateMlPerHour,notes:v.notes||null});
 this.vital=emptyVital();this.measured=measuredFields();this.success.set('پایش علائم ثبت شد.');await this.load();
 }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 eventLabel(s:string){return s==='ReactionReport'?'ثبت گزارش واکنش':s==='Dispatch'?'صدور و ارسال':s==='Vital'?'ثبت پایش':ACTIONS[s as TransferAction]??s;}
 status(s:string){return STATUSES[s as keyof typeof STATUSES]??s;}
 evidence(raw:string|null){if(!raw)return '';try{const v=JSON.parse(raw) as Record<string,unknown>;const labels:Record<string,string>={UnitCode:'کد واحد مشاهده‌شده',WristbandCode:'مچ‌بند مشاهده‌شده',Checks:'چک‌لیست',Temperature:'دما',Condition:'وضعیت',ReceiverName:'فرد مرتبط',NeedleReference:'وسیله',SuspectedReaction:'نگرانی',CarrierName:'حامل',CarrierCode:'کد حامل',ContainerCode:'ظرف',TransportIndicator:'نشانگر',PackCount:'تعداد آیس‌پک',Phase:'نوبت',MeasuredAt:'زمان اندازه‌گیری',ActualOccurredAt:'زمان واقعی واقعه',VolumeMl:'حجم مشاهده‌شده'};
 return Object.entries(v).filter(([k,x])=>k in labels&&x!==null&&x!==''&&x!==false).map(([k,x])=>labels[k]+': '+(typeof x==='boolean'?'ثبت شده':String(x))).join(' | ');
 }catch{return raw;}}
 exportVitals(){const d=this.detail();if(d)downloadCsv('hemo-vitals-'+d.transfer.unitCode+'.csv',[['حواله','نوبت','زمان','سیستولیک','دیاستولیک','نبض','دما','SpO2','تنفس','دیورز','سرعت ثبت‌شده','یادداشت'],...d.vitals.map(v=>[d.transfer.transferNumber,PHASES[v.phase],bankDateTime(v.measuredAt),v.systolic,v.diastolic,v.pulse,v.temperature,v.spo2,v.respiration,v.urineMl,v.rateMlPerHour,v.notes])]);}
 exportEvents(){const d=this.detail();if(d)downloadCsv('hemo-transfer-events-'+d.transfer.unitCode+'.csv',[['زمان','رویداد','وضعیت','شناسه کاربر','شرح','شواهد'],...d.events.map(e=>[bankDateTime(e.occurredAt),this.eventLabel(e.action),this.status(e.newStatus),e.actorUserGuid,e.notes,this.evidence(e.evidenceJson)])]);}
 print(){window.print();}
}
