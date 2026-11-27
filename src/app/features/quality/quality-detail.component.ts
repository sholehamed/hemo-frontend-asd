import {Component,OnInit,inject,signal,computed} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {bankDateTime,localFields,toUtc} from '../blood-bank/bank-time';
import {QualityKind,QualityDetail,QualityLine,Owner,KINDS,QUALITY_STATUS,allowedRecordActions,allowedResolutionActions,key,statusColor} from './quality-model';
import {HEADERS,LINES,blank,payload,display} from './quality-fields';
const ACT:Record<string,string>={Create:'ایجاد پیش‌نویس',Edit:'اصلاح پرونده',SaveLine:'ثبت ردیف',Submit:'ارسال برای بازبینی',Approve:'تأیید مستقل پرونده',Reject:'بازگشت برای اصلاح',Close:'بستن صورت‌جلسه',Progress:'ثبت پیشرفت مصوبه',Verify:'تأیید مستقل مصوبه',Return:'رد مصوبه / بازگشت',ResolutionProgress:'ثبت پیشرفت مصوبه',ResolutionVerify:'تأیید مصوبه',ResolutionReturn:'بازگشت مصوبه'};
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./quality-detail.component.html',styleUrl:'./quality-detail.css'})
export class QualityDetailComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(QualityService);private route=inject(ActivatedRoute);
 readonly kind=this.route.snapshot.data['kind'] as QualityKind;readonly title=KINDS[this.kind];readonly path=this.kind.toLowerCase();readonly guid=this.route.snapshot.paramMap.get('guid')??'';
 readonly headerFields=HEADERS[this.kind];readonly lineFields=LINES[this.kind];readonly display=display;readonly key=key;readonly fa=fa;readonly date=bankDateTime;readonly color=statusColor;readonly status=QUALITY_STATUS;readonly labels=ACT;
 readonly lineLabel=({Qc:'معرف / آزمون',Committee:'مصوبه',Audit:'بند ارزیابی',Training:'شرکت‌کننده'} as const)[this.kind];
 readonly detail=signal<QualityDetail|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly editingHeader=signal(false);readonly editingLine=signal(false);readonly action=signal('');readonly lineAction=signal<{line:QualityLine;action:string}|null>(null);
 readonly owners=signal<Owner[]>([]);readonly editTarget=signal<QualityLine|null>(null);
 readonly canEdit=computed(()=>{const r=this.detail()?.record;return !!r&&r.status==='Draft'&&r.createdByUserGuid===this.auth.qualityCapabilities()?.userGuid;});
 readonly actions=computed(()=>{const d=this.detail();return d?allowedRecordActions(d.record,this.auth.qualityCapabilities()):[];});
 form={title:'',ward:'',...localFields(),notes:''};header=blank(this.headerFields);line={title:'',ownerUserGuid:'',dueDate:''};lineData=blank(this.lineFields);notes='';progress=0;
 ngOnInit(){if(this.auth.qualityCan(key(this.kind,'Detail')))void this.load();}
 async load(){if(!this.auth.qualityCan(key(this.kind,'Detail')))return;this.busy.set(true);this.error.set(null);try{this.detail.set(await this.api.detail(this.kind,this.guid));}catch(e){this.detail.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 reset(){this.editingHeader.set(false);this.editingLine.set(false);this.action.set('');this.lineAction.set(null);this.error.set(null);this.success.set(null);this.notes='';}
 startHeader(){const d=this.detail();if(!d||!this.canEdit())return;this.reset();this.form={title:d.record.title,ward:d.record.ward,...localFields(d.record.occurredAt),notes:''};this.header=blank(this.headerFields,d.header);this.editingHeader.set(true);}
 async saveHeader(){const d=this.detail();if(!d||!this.canEdit()||this.busy()||!this.auth.qualityCan(key(this.kind,'Edit')))return;this.error.set(null);this.busy.set(true);try{await this.api.action(this.kind,'Edit',{guid:d.record.guid,version:d.record.version,title:this.form.title,ward:this.form.ward,occurredAt:toUtc(this.form.date,this.form.time),header:payload(this.headerFields,this.header),notes:this.form.notes});this.editingHeader.set(false);this.success.set('اطلاعات پرونده ثبت شد.');await this.load();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async startLine(l:QualityLine|null=null){if(!this.canEdit()||!this.auth.qualityCan(key(this.kind,'Line'))||this.busy())return;this.reset();this.editTarget.set(l);this.line={title:l?.title??'',ownerUserGuid:l?.ownerUserGuid??'',dueDate:l?.dueAt?localFields(l.dueAt).date:''};this.lineData=blank(this.lineFields,l?.data??{});this.busy.set(true);try{if(this.kind==='Committee'||this.kind==='Training')this.owners.set(await this.api.owners(this.kind));this.editingLine.set(true);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async saveLine(){const d=this.detail(),l=this.editTarget();if(!d||!this.canEdit()||!this.auth.qualityCan(key(this.kind,'Line'))||this.busy())return;this.error.set(null);this.busy.set(true);try{const owner=['Committee','Training'].includes(this.kind)?this.line.ownerUserGuid||null:null;const dueAt=this.kind==='Committee'?new Date(Date.parse(toUtc(this.line.dueDate,'23:59'))+59999).toISOString():null;await this.api.action(this.kind,'Line',{guid:d.record.guid,version:d.record.version,title:this.line.title,data:payload(this.lineFields,this.lineData),ownerUserGuid:owner,dueAt,lineGuid:l?.guid??null,lineVersion:l?.version??null});this.editingLine.set(false);this.success.set('ردیف پرونده ثبت شد.');await this.load();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 select(a:string){this.reset();this.action.set(a);}
 async apply(){const d=this.detail(),a=this.action();if(!d||!this.actions().includes(a)||this.busy())return;this.error.set(null);try{if(!this.notes.trim())throw new Error('شرح مستند الزامی است.');if(!window.confirm(ACT[a]+' ثبت شود؟'))return;this.busy.set(true);await this.api.action(this.kind,a,{guid:d.record.guid,version:d.record.version,notes:this.notes});this.action.set('');this.success.set('عملیات ثبت شد: '+ACT[a]);await this.load();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 lineActions(l:QualityLine){const d=this.detail();return d?allowedResolutionActions(d.record,l,this.auth.qualityCapabilities()):[];}
 selectLine(l:QualityLine,a:string){this.reset();this.lineAction.set({line:l,action:a});this.progress=l.progress;}
 async applyLine(){const d=this.detail(),sel=this.lineAction();if(!d||!sel||!this.lineActions(sel.line).includes(sel.action)||this.busy())return;this.error.set(null);try{if(!this.notes.trim()||!Number.isInteger(this.progress)||this.progress<0||this.progress>100)throw new Error('درصد و شرح مستند لازم است.');if(!window.confirm(ACT[sel.action]+' ثبت شود؟'))return;this.busy.set(true);await this.api.action('Committee',sel.action,{guid:d.record.guid,version:d.record.version,lineGuid:sel.line.guid,lineVersion:sel.line.version,progress:this.progress,evidence:this.notes});this.lineAction.set(null);this.success.set('پیگیری مصوبه ثبت شد.');await this.load();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 export(){const d=this.detail();if(d)downloadCsv('hemo-'+d.record.number+'.csv',[['پرونده','ردیف',...this.lineFields.map(f=>f.label),'وضعیت','مسئول / شرکت‌کننده','موعد','پیشرفت','شواهد'],...d.lines.map(l=>[d.record.number,l.title,...this.lineFields.map(f=>display(f,l.data[f.key])),QUALITY_STATUS[l.status],l.ownerUserGuid,bankDateTime(l.dueAt),l.progress,l.evidence])]);}
 exportEvents(){const d=this.detail();if(d)downloadCsv('hemo-history-'+d.record.number+'.csv',[['زمان','عملیات','وضعیت قبلی','وضعیت جدید','کاربر','شرح','جزئیات'],...d.events.map(e=>[bankDateTime(e.occurredAt),ACT[e.action]??e.action,e.previousStatus,e.newStatus,e.actorUserGuid,e.notes,e.evidenceJson])]);}
 print(){window.print();}
}
