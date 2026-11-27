import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {HvPageAccess} from './hv-page-access';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,toUtc,localFields} from '../blood-bank/bank-time';
import {HvMetricsComponent} from './hv-metrics.component';
import {ReportRow,ReportDetail,Summary,ReportInput,EXTERNAL} from './hv-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,HemovigilanceService,HvPageAccess],imports:[FormsModule,MatButtonModule,RequestStateComponent,HvMetricsComponent],templateUrl:'./hv-reports.component.html'})
export class HvReportsComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(HvPageAccess);private api=inject(HemovigilanceService);readonly page=signal<BankPage<ReportRow>|null>(null);readonly detail=signal<ReportDetail|null>(null);readonly preview=signal<Summary|null>(null);
 readonly busy=signal(false);readonly savedGuid=signal<string|null>(null);readonly previewInput=signal<ReportInput|null>(null);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);readonly date=bankDateTime;readonly fa=fa;readonly external=EXTERNAL;readonly options=Object.entries(EXTERNAL).filter(([k])=>k!=='NotRecorded');
 form={title:'گزارش داخلی هموویژیلانس',fromDate:localFields(new Date(Date.now()-86400000*30).toISOString()).date,toDate:localFields().date,ward:'',productCode:''};externalForm={status:'',reference:''};
 private seq=0;
 canOpen(){return this.auth.hvCan('reports')&&this.auth.hvCan('reportDetail');}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){await this.auth.load();if(this.canOpen())await this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.seq;this.page.set(null);this.detail.set(null);this.preview.set(null);this.previewInput.set(null);this.savedGuid.set(null);this.externalForm={status:'',reference:''};this.form={title:'',fromDate:'',toDate:'',ward:'',productCode:''};}
 private input():ReportInput{const v=this.form;if(!v.title.trim()||!v.fromDate||!v.toDate)throw new Error('عنوان و بازه زمانی لازم است.');
 const from=toUtc(v.fromDate,'00:00'),to=new Date(Date.parse(toUtc(v.toDate,'23:59'))+59999).toISOString();if(Date.parse(from)>Date.parse(to))throw new Error('بازه زمانی معتبر نیست.');return {title:v.title.trim(),from,to,ward:v.ward.trim(),productCode:v.productCode.trim()};}
 private clearDetail(){this.detail.set(null);this.externalForm={status:'',reference:''};}
 private clearPreview(){this.preview.set(null);this.previewInput.set(null);}
 private async fetchDetail(id:string,seq:number){const d=await this.api.reportDetail(id);if(!this.current(seq))return;if(d.report.guid.toLowerCase()!==id.toLowerCase())throw new Error('شناسه گزارش مطابقت ندارد.');this.detail.set(d);this.externalForm={status:'',reference:''};}
 private async fetchPage(pageNumber:number,seq:number){const p=await this.api.reports(pageNumber);if(this.current(seq))this.page.set(p);}
 async load(pageNumber=1){
   if(!this.canOpen()||this.busy())return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.page.set(null);
   try{await this.fetchPage(pageNumber,seq);}catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async showPreview(){
   if(!this.canOpen()||!this.auth.hvCan('stats')||this.busy())return;
   const seq=++this.seq;this.error.set(null);this.success.set(null);this.clearPreview();this.clearDetail();
   try{const v=this.input();this.busy.set(true);const s=await this.api.stats({from:v.from,to:v.to,ward:v.ward,productCode:v.productCode});if(this.current(seq)){this.previewInput.set(v);this.preview.set(s);}}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 newReport(){if(!this.canOpen()||this.busy())return;this.savedGuid.set(null);this.success.set(null);this.error.set(null);this.clearDetail();this.clearPreview();}
 async archive(){
   if(!this.canOpen()||!this.auth.hvCan('archive')||this.busy()||this.savedGuid())return;
   const seq=++this.seq;this.error.set(null);this.success.set(null);
   try{
     const v=this.input();if(!window.confirm('گزارش تجمیعی جدید با داده‌های زمان ثبت آرشیو شود؟'))return;this.busy.set(true);this.clearDetail();this.clearPreview();
     const id=await this.api.archive(v);if(!this.current(seq))return;
     this.savedGuid.set(id);this.success.set('گزارش داخلی در آرشیو ثبت شد.');this.page.set(null);
     const results=await Promise.allSettled([this.fetchDetail(id,seq),this.fetchPage(1,seq)]);
     if(this.current(seq)&&results.some(r=>r.status==='rejected'))this.error.set('گزارش ذخیره شد؛ دریافت مجدد جزئیات یا فهرست ناموفق بود. از شناسه ثبت‌شده استفاده کنید.');
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async open(id:string){
   if(!this.canOpen()||this.busy()||!(id===this.savedGuid()||this.page()?.data.some(r=>r.guid===id)))return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.clearDetail();this.clearPreview();
   try{await this.fetchDetail(id,seq);}catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 async recordExternal(){
   const d=this.detail(),v=this.externalForm;if(!d||!this.canOpen()||!this.auth.hvCan('reportExternal')||this.busy())return;
   const seq=++this.seq;this.error.set(null);this.success.set(null);
   try{
     if(!this.options.some(([key])=>key===v.status)||v.status==='SentManually'&&!v.reference.trim())throw new Error('وضعیت و مرجع ارسال واقعی لازم است.');
     if(!window.confirm('وضعیت مستند گزارش بیرونی ثبت شود؟'))return;this.busy.set(true);
     await this.api.reportExternal(d.report.guid,d.report.version,v.status,v.status==='SentManually'?v.reference.trim():null);if(!this.current(seq))return;
     const pageNumber=this.page()?.pageNumber??1;this.clearDetail();this.page.set(null);this.success.set('وضعیت گزارش بیرونی ثبت شد.');
     const results=await Promise.allSettled([this.fetchDetail(d.report.guid,seq),this.fetchPage(pageNumber,seq)]);
     if(this.current(seq)&&results.some(r=>r.status==='rejected'))this.error.set('وضعیت ثبت شد؛ دریافت مجدد گزارش یا فهرست ناموفق بود.');
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 export(s:Summary){if(!this.canOpen()||this.busy()||!(s===this.detail()?.summary||(this.auth.hvCan('stats')&&s===this.preview())))return;downloadCsv('hemo-hv-summary.csv',[['گروه','شاخص','تعداد'],['کل','پرونده',s.total],['کل','باز',s.open],['کل','بسته',s.closed],['کل','تزریق شروع‌شده',s.startedTransfers],['کل','CAPA باز',s.capaOpen],['کل','CAPA سررسید گذشته',s.capaOverdue],...([['تشخیص',s.byDiagnosis],['شدت',s.bySeverity],['بخش',s.byWard],['فرآورده',s.byProduct],['وضعیت',s.byStatus]] as const).flatMap(([group,rows])=>rows.map(x=>[group,x.key,x.count]))]);}
 print(){if(this.canOpen()&&!this.busy()&&(this.detail()||(this.auth.hvCan('stats')&&this.preview())))window.print();}
}
