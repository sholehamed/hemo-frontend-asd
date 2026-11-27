import {Component,OnInit,OnDestroy,inject,signal,computed} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {Subscription} from 'rxjs';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {bankDateTime,localFields,toUtc} from '../blood-bank/bank-time';
import {QualityKind,QualityDetail,QualityLine,Owner,KINDS,QUALITY_STATUS,allowedRecordActions,allowedResolutionActions,key,statusColor} from './quality-model';
import {HEADERS,LINES,blank,payload,display} from './quality-fields';
const ACT:Record<string,string>={Create:'ایجاد پیش‌نویس',Edit:'اصلاح پرونده',SaveLine:'ثبت ردیف',Submit:'ارسال برای بازبینی',Approve:'تأیید مستقل پرونده',Reject:'بازگشت برای اصلاح',Close:'بستن صورت‌جلسه',Progress:'ثبت پیشرفت مصوبه',Verify:'تأیید مستقل مصوبه',Return:'رد مصوبه / بازگشت',ResolutionProgress:'ثبت پیشرفت مصوبه',ResolutionVerify:'تأیید مصوبه',ResolutionReturn:'بازگشت مصوبه'};
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./quality-detail.component.html',styleUrl:'./quality-detail.css'})
export class QualityDetailComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);private route=inject(ActivatedRoute);
 readonly kind=this.route.snapshot.data['kind'] as QualityKind;readonly title=KINDS[this.kind];readonly path=this.kind.toLowerCase();private guid='';
 readonly headerFields=HEADERS[this.kind];readonly lineFields=LINES[this.kind];readonly display=display;readonly key=key;readonly fa=fa;readonly date=bankDateTime;readonly color=statusColor;readonly status=QUALITY_STATUS;readonly labels=ACT;
 readonly lineLabel=({Qc:'معرف / آزمون',Committee:'مصوبه',Audit:'بند ارزیابی',Training:'شرکت‌کننده'} as const)[this.kind];
 readonly detail=signal<QualityDetail|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);
 readonly editingHeader=signal(false);readonly editingLine=signal(false);readonly action=signal('');readonly lineAction=signal<{line:QualityLine;action:string}|null>(null);
 readonly owners=signal<Owner[]>([]);readonly editTarget=signal<QualityLine|null>(null);
 readonly canEdit=computed(()=>{const r=this.detail()?.record;return this.canOpen()&&!!r&&r.status==='Draft'&&r.createdByUserGuid===this.auth.qualityCapabilities()?.userGuid;});
 readonly actions=computed(()=>{const d=this.detail();return d&&this.canOpen()?allowedRecordActions(d.record,this.auth.qualityCapabilities()).filter(a=>a!=='Close'||(d.lines.length>0&&d.lines.every(l=>l.status==='Verified'))):[];});
 form={title:'',ward:'',...localFields(),notes:''};header=blank(this.headerFields);line={title:'',ownerUserGuid:'',dueDate:''};lineData=blank(this.lineFields);notes='';progress=0;
 private seq=0;private params?:Subscription;
 canOpen(){return this.auth.qualityCan(key(this.kind,'Detail'));}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){await this.auth.load();if(!this.canOpen())return;this.params=this.route.paramMap.subscribe(p=>{++this.seq;this.guid=p.get('guid')??'';this.detail.set(null);this.reset();this.busy.set(false);this.saving.set(false);if(this.guid)void this.load();});}
 ngOnDestroy(){this.params?.unsubscribe();this.scope.invalidate();++this.seq;this.detail.set(null);this.reset();}
 async load(){if(!this.canOpen()||!this.guid||this.saving())return;const seq=++this.seq,guid=this.guid;this.detail.set(null);this.reset();this.busy.set(true);
   try{const d=await this.api.detail(this.kind,guid);if(!this.current(seq))return;if(d.record.guid.toLowerCase()!==guid.toLowerCase()||d.record.kind!==this.kind)throw new Error('شناسه یا نوع پرونده مطابقت ندارد.');this.detail.set(d);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 reset(){this.editingHeader.set(false);this.editingLine.set(false);this.action.set('');this.lineAction.set(null);this.editTarget.set(null);this.owners.set([]);this.error.set(null);this.success.set(null);this.notes='';this.progress=0;this.form={title:'',ward:'',...localFields(),notes:''};this.header=blank(this.headerFields);this.line={title:'',ownerUserGuid:'',dueDate:''};this.lineData=blank(this.lineFields);}
 private currentLine(l:QualityLine){return this.detail()?.lines.find(x=>x.guid===l.guid&&x.version===l.version);}
 private available(){return this.canOpen()&&!this.busy()&&!this.saving();}
 private async write(action:()=>Promise<unknown>,notice:string){
   if(!this.available())return;const seq=this.seq;this.error.set(null);this.success.set(null);this.saving.set(true);
   try{await action();if(!this.current(seq))return;this.saving.set(false);const task=this.load(),reloadSeq=this.seq;await task;if(this.current(reloadSeq))this.success.set(notice);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}
 }
 startHeader(){const d=this.detail();if(!d||!this.available()||!this.canEdit()||!this.auth.qualityCan(key(this.kind,'Edit')))return;this.reset();this.form={title:d.record.title,ward:d.record.ward,...localFields(d.record.occurredAt),notes:''};this.header=blank(this.headerFields,d.header);this.editingHeader.set(true);}
 async saveHeader(){const d=this.detail();if(!d||!this.editingHeader()||!this.canEdit()||!this.available()||!this.auth.qualityCan(key(this.kind,'Edit')))return;
   await this.write(()=>{if(!this.form.title.trim()||!this.form.ward.trim()||!this.form.notes.trim())throw new Error('عنوان، بخش و شرح اصلاح لازم است.');return this.api.action(this.kind,'Edit',{guid:d.record.guid,version:d.record.version,title:this.form.title,ward:this.form.ward,occurredAt:toUtc(this.form.date,this.form.time),header:payload(this.headerFields,this.header),notes:this.form.notes});},'اطلاعات پرونده ثبت شد.');
 }
 async startLine(l:QualityLine|null=null){
   if(!this.available()||!this.canEdit()||!this.auth.qualityCan(key(this.kind,'Line'))||(l&&!this.currentLine(l)))return;
   const needsOwner=this.kind==='Committee'||this.kind==='Training';if(needsOwner&&!this.auth.qualityCan(key(this.kind,'Owners')))return;
   const seq=this.seq;this.reset();const item=l?this.currentLine(l):null;this.editTarget.set(item??null);this.line={title:item?.title??'',ownerUserGuid:item?.ownerUserGuid??'',dueDate:item?.dueAt?localFields(item.dueAt).date:''};this.lineData=blank(this.lineFields,item?.data??{});this.busy.set(true);
   try{if(needsOwner){const owners=await this.api.owners(this.kind);if(!this.current(seq))return;this.owners.set(owners);}if(this.current(seq))this.editingLine.set(true);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async saveLine(){const d=this.detail(),l=this.editTarget();if(!d||!this.editingLine()||!this.available()||!this.canEdit()||!this.auth.qualityCan(key(this.kind,'Line'))||(l&&!this.currentLine(l)))return;
   await this.write(()=>{if(!this.line.title.trim())throw new Error('عنوان ردیف لازم است.');const needsOwner=this.kind==='Committee'||this.kind==='Training';const owner=needsOwner?this.line.ownerUserGuid||null:null;if(needsOwner&&(!this.auth.qualityCan(key(this.kind,'Owners'))||!this.owners().some(o=>o.userGuid===owner)))throw new Error('حساب فعال مجاز را انتخاب کنید.');
     const dueAt=this.kind==='Committee'?new Date(Date.parse(toUtc(this.line.dueDate,'23:59'))+59999).toISOString():null;
     return this.api.action(this.kind,'Line',{guid:d.record.guid,version:d.record.version,title:this.line.title,data:payload(this.lineFields,this.lineData),ownerUserGuid:owner,dueAt,lineGuid:l?.guid??null,lineVersion:l?.version??null});},'ردیف پرونده ثبت شد.');
 }
 select(a:string){if(!this.available()||!this.actions().includes(a))return;this.reset();this.action.set(a);}
 async apply(){const d=this.detail(),a=this.action();if(!d||!this.available()||!this.actions().includes(a))return;if(!this.notes.trim()){this.error.set('شرح مستند الزامی است.');return;}if(!window.confirm(ACT[a]+' ثبت شود؟'))return;
   await this.write(()=>this.api.action(this.kind,a,{guid:d.record.guid,version:d.record.version,notes:this.notes}),'عملیات ثبت شد: '+ACT[a]);
 }
 lineActions(l:QualityLine){const d=this.detail(),item=this.currentLine(l);return d&&item&&this.canOpen()?allowedResolutionActions(d.record,item,this.auth.qualityCapabilities()):[];}
 selectLine(l:QualityLine,a:string){const item=this.currentLine(l);if(!item||!this.available()||!this.lineActions(item).includes(a))return;this.reset();this.lineAction.set({line:item,action:a});this.progress=item.progress;}
 async applyLine(){const d=this.detail(),sel=this.lineAction();if(!d||!sel||!this.available()||!this.lineActions(sel.line).includes(sel.action))return;
   const item=this.currentLine(sel.line)!;const progress=sel.action==='Progress'?this.progress:item.progress;
   if(!this.notes.trim()||!Number.isInteger(progress)||progress<0||progress>100){this.error.set('درصد و شرح مستند لازم است.');return;}if(!window.confirm(ACT[sel.action]+' ثبت شود؟'))return;
   await this.write(()=>this.api.action('Committee',sel.action,{guid:d.record.guid,version:d.record.version,lineGuid:item.guid,lineVersion:item.version,progress,evidence:this.notes}),'پیگیری مصوبه ثبت شد.');
 }
 export(){const d=this.detail();if(d&&this.available())downloadCsv('hemo-'+d.record.number+'.csv',[['پرونده','ردیف',...this.lineFields.map(f=>f.label),'وضعیت','مسئول / شرکت‌کننده','موعد','پیشرفت','شواهد'],...d.lines.map(l=>[d.record.number,l.title,...this.lineFields.map(f=>display(f,l.data[f.key])),QUALITY_STATUS[l.status],l.ownerUserGuid,bankDateTime(l.dueAt),l.progress,l.evidence])]);}
 exportEvents(){const d=this.detail();if(d&&this.available())downloadCsv('hemo-history-'+d.record.number+'.csv',[['زمان','عملیات','وضعیت قبلی','وضعیت جدید','کاربر','شرح','جزئیات'],...d.events.map(e=>[bankDateTime(e.occurredAt),ACT[e.action]??e.action,e.previousStatus,e.newStatus,e.actorUserGuid,e.notes,e.evidenceJson])]);}
 print(){if(this.detail()&&this.available())window.print();}
}
