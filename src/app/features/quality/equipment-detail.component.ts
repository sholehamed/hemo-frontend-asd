import {Component,OnInit,OnDestroy,inject,signal,computed} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {HemoRelatedLinksComponent} from '../../shared/components/hemo-related-links.component';
import {Subscription} from 'rxjs';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {bankDateTime,toUtc} from '../blood-bank/bank-time';
import {measuredFields,measuredUtc} from '../transfusion/transfer-time';
import {ASSESSMENTS} from '../blood-bank/bank-model';
import {EquipmentDetail,Incident,CATEGORIES,EQUIPMENT_STATUS,SERVICE_KINDS,RESULTS,SHIFTS,URGENCIES,QUALITY_STATUS,equipmentActions,equipmentDue,statusColor} from './quality-model';
const LABELS:Record<string,string>={Register:'ثبت شناسنامه',Edit:'اصلاح شناسنامه',Service:'ثبت سرویس / کالیبراسیون',Hold:'توقف فنی',Release:'تأیید مستقل بازگشت تجهیز',Archive:'آرشیو تجهیز',Temperature:'ثبت پایش دما',TemperatureHold:'توقف فنی ناشی از انحراف دما',IncidentReport:'گزارش خرابی / حادثه',IncidentResolve:'ثبت رفع نقص'};
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[HemoRelatedLinksComponent,FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./equipment-detail.component.html',styleUrl:'./quality-detail.css'})
export class EquipmentDetailComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);private route=inject(ActivatedRoute);
 private guid='';readonly detail=signal<EquipmentDetail|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly action=signal<string>('');readonly incident=signal<Incident|null>(null);readonly actions=computed(()=>{const d=this.detail();return d?equipmentActions(d,this.auth.qualityCapabilities()):[];});
 readonly category=CATEGORIES;readonly statuses=EQUIPMENT_STATUS;readonly labels=LABELS;readonly serviceKinds=SERVICE_KINDS;readonly incidentStatus=QUALITY_STATUS;readonly urgency=URGENCIES;readonly assessment=ASSESSMENTS;readonly results=RESULTS;readonly shift=SHIFTS;
 readonly options={category:Object.entries(CATEGORIES),service:Object.entries(SERVICE_KINDS),result:Object.entries(RESULTS),shift:Object.entries(SHIFTS),urgency:Object.entries(URGENCIES),assessment:Object.entries(ASSESSMENTS)};
 readonly color=statusColor;readonly due=equipmentDue;readonly date=bankDateTime;readonly fa=fa;
 form={name:'',category:'',brandModel:'',ward:'',serialNumber:'',notes:'',reference:'',provider:'',kind:'',result:'',checks:'',urgency:'',description:'',resolution:'',shift:'',temperature:null as number|null,minimum:null as number|null,maximum:null as number|null,alarmChecked:false,doorChecked:false,powerChecked:false,assessment:''};
 actual=measuredFields();dueDate='';dueTime='23:59';useNow=false;
 private seq=0;private params?:Subscription;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private clear(){this.action.set('');this.incident.set(null);this.form={name:'',category:'',brandModel:'',ward:'',serialNumber:'',notes:'',reference:'',provider:'',kind:'',result:'',checks:'',urgency:'',description:'',resolution:'',shift:'',temperature:null,minimum:null,maximum:null,alarmChecked:false,doorChecked:false,powerChecked:false,assessment:''};this.actual=measuredFields();this.dueDate='';this.dueTime='23:59';this.useNow=false;}
 async ngOnInit(){await this.auth.load();if(!this.auth.qualityCan('equipmentDetail'))return;this.params=this.route.paramMap.subscribe(p=>{++this.seq;this.guid=p.get('guid')??'';this.detail.set(null);this.clear();this.success.set(null);this.error.set(null);this.busy.set(false);this.saving.set(false);if(this.guid)void this.load(true);});}
 ngOnDestroy(){this.params?.unsubscribe();this.scope.invalidate();++this.seq;this.detail.set(null);this.clear();this.success.set(null);}
 async load(first=false){
   if(!this.auth.qualityCan('equipmentDetail')||!this.guid||this.saving())return;
   const seq=++this.seq,guid=this.guid;this.detail.set(null);this.clear();this.busy.set(true);this.error.set(null);
   try{const d=await this.api.equipmentDetail(guid);if(!this.current(seq))return;if(d.equipment.guid.toLowerCase()!==guid.toLowerCase())throw new Error('شناسه تجهیز مطابقت ندارد.');this.detail.set(d);this.busy.set(false);const a=this.route.snapshot.queryParamMap.get('action');if(first&&a&&this.actions().includes(a))this.select(a);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 canResolve(i:Incident){const d=this.detail();return !!d&&this.auth.qualityCan('equipmentDetail')&&this.auth.qualityCan('incidentResolve')&&d.equipment.status!=='Archived'&&i.equipmentGuid===d.equipment.guid&&i.equipmentVersion===d.equipment.version&&d.incidents.some(x=>x.guid===i.guid&&x.version===i.version&&x.status==='Open');}
 private async refreshAfterWrite(seq:number,notice:string){if(!this.current(seq))return;this.saving.set(false);const refresh=this.load();const reloadSeq=this.seq;await refresh;if(this.current(reloadSeq))this.success.set(notice);}
 select(a:string,i:Incident|null=null){const d=this.detail();if(!d||!this.auth.qualityCan('equipmentDetail')||this.busy()||this.saving()||(a==='IncidentResolve'?(!i||!this.canResolve(i)):!equipmentActions(d,this.auth.qualityCapabilities()).includes(a)))return;this.clear();this.action.set(a);this.incident.set(i);this.error.set(null);this.success.set(null);this.form={name:d.equipment.name,category:d.equipment.category,brandModel:d.equipment.brandModel,ward:d.equipment.ward,serialNumber:d.equipment.serialNumber??'',notes:'',reference:'',provider:'',kind:'',result:'',checks:'',urgency:'',description:'',resolution:'',shift:'',temperature:null,minimum:null,maximum:null,alarmChecked:false,doorChecked:false,powerChecked:false,assessment:''};this.actual=measuredFields();this.dueDate='';this.useNow=false;}
 async save(){const d=this.detail(),a=this.action(),v=this.form;if(!d||!a||!this.auth.qualityCan('equipmentDetail')||this.busy()||this.saving())return;const seq=this.seq;this.error.set(null);this.success.set(null);try{
 if(a!=='IncidentReport'&&a!=='IncidentResolve'&&!v.notes.trim())throw new Error('شرح مستند الزامی است.');
 const e=d.equipment;let input:Record<string,unknown>={guid:e.guid,version:e.version,notes:v.notes,reference:v.reference||null};
 if(a==='Edit')input={...input,name:v.name,category:v.category,brandModel:v.brandModel,ward:v.ward,serialNumber:v.serialNumber||null};
 if(a==='Service'){if(!Object.prototype.hasOwnProperty.call(SERVICE_KINDS,v.kind)||!Object.prototype.hasOwnProperty.call(RESULTS,v.result)||!v.provider.trim()||!v.checks.trim()||!v.reference.trim()||(v.result==='Accepted'&&['Calibration','Maintenance'].includes(v.kind)&&!this.dueDate))throw new Error('مشخصات سرویس، گواهی و سررسید مستند را تکمیل کنید.');}
 if(a==='Release'&&!v.reference.trim())throw new Error('مرجع تأیید مستقل لازم است.');
 if(a==='Service')input={...input,kind:v.kind,performedAt:this.useNow?new Date().toISOString():measuredUtc(this.actual.date,this.actual.time),dueAt:this.dueDate?toUtc(this.dueDate,this.dueTime):null,provider:v.provider,result:v.result,checks:v.checks};
 if(a==='Temperature'){if(!Object.prototype.hasOwnProperty.call(SHIFTS,v.shift)||!Object.prototype.hasOwnProperty.call(ASSESSMENTS,v.assessment))throw new Error('شیفت و ارزیابی مستند لازم است.');if([v.temperature,v.minimum,v.maximum].some(x=>x===null||!Number.isFinite(x))||v.minimum!>v.temperature!||v.temperature!>v.maximum!)throw new Error('حداقل، لحظه‌ای و حداکثر ثبت‌شده باید مرتب و معتبر باشند.');input={...input,measuredAt:this.useNow?new Date().toISOString():measuredUtc(this.actual.date,this.actual.time),shift:v.shift,temperature:v.temperature,minimum:v.minimum,maximum:v.maximum,alarmChecked:v.alarmChecked,doorChecked:v.doorChecked,powerChecked:v.powerChecked,assessment:v.assessment};}
 if(a==='IncidentReport'&&(!Object.prototype.hasOwnProperty.call(URGENCIES,v.urgency)||!v.description.trim()))throw new Error('فوریت و شرح حادثه لازم است.');
 if(a==='IncidentReport')input={guid:e.guid,version:e.version,urgency:v.urgency,description:v.description};
 if(a==='IncidentResolve'){const i=this.incident();if(!i||!this.canResolve(i))return;if(!v.resolution.trim()||!v.reference.trim())throw new Error('شرح رفع نقص و مرجع لازم است.');input={guid:i.guid,version:i.version,equipmentVersion:e.version,resolution:v.resolution,reference:v.reference};}
 else if(!this.actions().includes(a))return;
 if(!window.confirm(LABELS[a]+' ثبت شود؟'))return;this.saving.set(true);await this.api.equipmentAction(a,input);await this.refreshAfterWrite(seq,'عملیات ثبت شد: '+LABELS[a]);
 }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}}
 eventLabel(s:string){return LABELS[s]??SERVICE_KINDS[s]??s;}
 evidence(s:string|null){if(!s)return '';try{const j=JSON.parse(s),v=j.Input??j;return Object.entries(v).filter(([k,x])=>['Result','Checks','PerformedAt','Temperature','Minimum','Maximum','Shift','AlarmChecked','DoorChecked','PowerChecked','Assessment','Urgency'].includes(k)&&x!==null).map(([k,x])=>({Result:'نتیجه',Checks:'کنترل‌ها',PerformedAt:'زمان انجام',Temperature:'دما',Minimum:'حداقل',Maximum:'حداکثر',Shift:'شیفت',AlarmChecked:'بررسی آلارم',DoorChecked:'بررسی درب',PowerChecked:'بررسی برق',Assessment:'ارزیابی',Urgency:'فوریت'}[k]??k)+': '+String(x)).join(' | ');}catch{return s;}}
 export(){const d=this.detail();if(d&&this.auth.qualityCan('equipmentDetail')&&!this.busy()&&!this.saving())downloadCsv('hemo-equipment-'+d.equipment.code+'.csv',[['تجهیز','زمان','رویداد','شرح','مرجع','شواهد'],...d.events.map(e=>[d.equipment.code,bankDateTime(e.occurredAt),this.eventLabel(e.kind),e.notes,e.reference,this.evidence(e.evidenceJson)])]);}
 print(){if(this.auth.qualityCan('equipmentDetail')&&this.detail()&&!this.busy()&&!this.saving())window.print();}
}
