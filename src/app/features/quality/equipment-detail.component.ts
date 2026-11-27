import {Component,OnInit,inject,signal,computed} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {bankDateTime,toUtc} from '../blood-bank/bank-time';
import {measuredFields,measuredUtc} from '../transfusion/transfer-time';
import {ASSESSMENTS} from '../blood-bank/bank-model';
import {EquipmentDetail,Incident,CATEGORIES,EQUIPMENT_STATUS,SERVICE_KINDS,RESULTS,SHIFTS,URGENCIES,QUALITY_STATUS,equipmentActions,equipmentDue,statusColor} from './quality-model';
const LABELS:Record<string,string>={Register:'ثبت شناسنامه',Edit:'اصلاح شناسنامه',Service:'ثبت سرویس / کالیبراسیون',Hold:'توقف فنی',Release:'تأیید مستقل بازگشت تجهیز',Archive:'آرشیو تجهیز',Temperature:'ثبت پایش دما',TemperatureHold:'توقف فنی ناشی از انحراف دما',IncidentReport:'گزارش خرابی / حادثه',IncidentResolve:'ثبت رفع نقص'};
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./equipment-detail.component.html',styleUrl:'./quality-detail.css'})
export class EquipmentDetailComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(QualityService);private route=inject(ActivatedRoute);
 readonly guid=this.route.snapshot.paramMap.get('guid')??'';readonly detail=signal<EquipmentDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly action=signal<string>('');readonly incident=signal<Incident|null>(null);readonly actions=computed(()=>{const d=this.detail();return d?equipmentActions(d,this.auth.qualityCapabilities()):[];});
 readonly category=CATEGORIES;readonly statuses=EQUIPMENT_STATUS;readonly labels=LABELS;readonly serviceKinds=SERVICE_KINDS;readonly incidentStatus=QUALITY_STATUS;readonly urgency=URGENCIES;readonly assessment=ASSESSMENTS;readonly results=RESULTS;readonly shift=SHIFTS;
 readonly options={category:Object.entries(CATEGORIES),service:Object.entries(SERVICE_KINDS),result:Object.entries(RESULTS),shift:Object.entries(SHIFTS),urgency:Object.entries(URGENCIES),assessment:Object.entries(ASSESSMENTS)};
 readonly color=statusColor;readonly due=equipmentDue;readonly date=bankDateTime;readonly fa=fa;
 form={name:'',category:'',brandModel:'',ward:'',serialNumber:'',notes:'',reference:'',provider:'',kind:'',result:'',checks:'',urgency:'',description:'',resolution:'',shift:'',temperature:null as number|null,minimum:null as number|null,maximum:null as number|null,alarmChecked:false,doorChecked:false,powerChecked:false,assessment:''};
 actual=measuredFields();dueDate='';dueTime='23:59';useNow=false;
 ngOnInit(){if(this.auth.qualityCan('equipmentDetail'))void this.load(true);}
 async load(first=false){if(!this.auth.qualityCan('equipmentDetail'))return;this.busy.set(true);this.error.set(null);try{const d=await this.api.equipmentDetail(this.guid);this.detail.set(d);const a=this.route.snapshot.queryParamMap.get('action');if(first&&a&&this.actions().includes(a))this.select(a);}catch(e){this.detail.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 select(a:string,i:Incident|null=null){const d=this.detail();if(!d)return;this.action.set(a);this.incident.set(i);this.error.set(null);this.success.set(null);this.form={name:d.equipment.name,category:d.equipment.category,brandModel:d.equipment.brandModel,ward:d.equipment.ward,serialNumber:d.equipment.serialNumber??'',notes:'',reference:'',provider:'',kind:'',result:'',checks:'',urgency:'',description:'',resolution:'',shift:'',temperature:null,minimum:null,maximum:null,alarmChecked:false,doorChecked:false,powerChecked:false,assessment:''};this.actual=measuredFields();this.dueDate='';this.useNow=false;}
 async save(){const d=this.detail(),a=this.action(),v=this.form;if(!d||!a||this.busy())return;this.error.set(null);this.success.set(null);try{
 const e=d.equipment;let input:Record<string,unknown>={guid:e.guid,version:e.version,notes:v.notes,reference:v.reference||null};
 if(a==='Edit')input={...input,name:v.name,category:v.category,brandModel:v.brandModel,ward:v.ward,serialNumber:v.serialNumber||null};
 if(a==='Service')input={...input,kind:v.kind,performedAt:this.useNow?new Date().toISOString():measuredUtc(this.actual.date,this.actual.time),dueAt:this.dueDate?toUtc(this.dueDate,this.dueTime):null,provider:v.provider,result:v.result,checks:v.checks};
 if(a==='Temperature'){if([v.temperature,v.minimum,v.maximum].some(x=>x===null||!Number.isFinite(x))||v.minimum!>v.temperature!||v.temperature!>v.maximum!)throw new Error('حداقل، لحظه‌ای و حداکثر ثبت‌شده باید مرتب و معتبر باشند.');input={...input,measuredAt:this.useNow?new Date().toISOString():measuredUtc(this.actual.date,this.actual.time),shift:v.shift,temperature:v.temperature,minimum:v.minimum,maximum:v.maximum,alarmChecked:v.alarmChecked,doorChecked:v.doorChecked,powerChecked:v.powerChecked,assessment:v.assessment};}
 if(a==='IncidentReport')input={guid:e.guid,version:e.version,urgency:v.urgency,description:v.description};
 if(a==='IncidentResolve'){const i=this.incident();if(!i||!this.auth.qualityCan('incidentResolve'))return;input={guid:i.guid,version:i.version,equipmentVersion:e.version,resolution:v.resolution,reference:v.reference};}
 else if(!this.actions().includes(a))return;
 if(!window.confirm(LABELS[a]+' ثبت شود؟'))return;this.busy.set(true);await this.api.equipmentAction(a,input);this.action.set('');this.incident.set(null);this.success.set('عملیات ثبت شد: '+LABELS[a]);await this.load();
 }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 eventLabel(s:string){return LABELS[s]??SERVICE_KINDS[s]??s;}
 evidence(s:string|null){if(!s)return '';try{const j=JSON.parse(s),v=j.Input??j;return Object.entries(v).filter(([k,x])=>['Result','Checks','PerformedAt','Temperature','Minimum','Maximum','Shift','AlarmChecked','DoorChecked','PowerChecked','Assessment','Urgency'].includes(k)&&x!==null).map(([k,x])=>({Result:'نتیجه',Checks:'کنترل‌ها',PerformedAt:'زمان انجام',Temperature:'دما',Minimum:'حداقل',Maximum:'حداکثر',Shift:'شیفت',AlarmChecked:'بررسی آلارم',DoorChecked:'بررسی درب',PowerChecked:'بررسی برق',Assessment:'ارزیابی',Urgency:'فوریت'}[k]??k)+': '+String(x)).join(' | ');}catch{return s;}}
 export(){const d=this.detail();if(d)downloadCsv('hemo-equipment-'+d.equipment.code+'.csv',[['تجهیز','زمان','رویداد','شرح','مرجع','شواهد'],...d.events.map(e=>[d.equipment.code,bankDateTime(e.occurredAt),this.eventLabel(e.kind),e.notes,e.reference,this.evidence(e.evidenceJson)])]);}
 print(){window.print();}
}
