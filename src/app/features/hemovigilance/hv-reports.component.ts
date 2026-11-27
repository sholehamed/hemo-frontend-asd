import {Component,OnInit,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,toUtc,localFields} from '../blood-bank/bank-time';
import {HvMetricsComponent} from './hv-metrics.component';
import {ReportRow,ReportDetail,Summary,ReportInput,EXTERNAL} from './hv-model';
@Component({standalone:true,imports:[FormsModule,MatButtonModule,RequestStateComponent,HvMetricsComponent],templateUrl:'./hv-reports.component.html'})
export class HvReportsComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(HemovigilanceService);readonly page=signal<BankPage<ReportRow>|null>(null);readonly detail=signal<ReportDetail|null>(null);readonly preview=signal<Summary|null>(null);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly success=signal<string|null>(null);readonly date=bankDateTime;readonly fa=fa;readonly external=EXTERNAL;readonly options=Object.entries(EXTERNAL).filter(([k])=>k!=='NotRecorded');
 form={title:'گزارش داخلی هموویژیلانس',fromDate:localFields(new Date(Date.now()-86400000*30).toISOString()).date,toDate:localFields().date,ward:'',productCode:''};externalForm={status:'',reference:''};
 ngOnInit(){if(this.auth.hvCan('reports'))void this.load();}
 private input():ReportInput{const v=this.form;if(!v.title.trim()||!v.fromDate||!v.toDate)throw new Error('عنوان و بازه زمانی لازم است.');
 const from=toUtc(v.fromDate,'00:00'),to=new Date(Date.parse(toUtc(v.toDate,'23:59'))+59999).toISOString();if(Date.parse(from)>Date.parse(to))throw new Error('بازه زمانی معتبر نیست.');return {title:v.title,from,to,ward:v.ward,productCode:v.productCode};}
 async load(pageNumber=1){if(!this.auth.hvCan('reports'))return;this.busy.set(true);this.error.set(null);try{this.page.set(await this.api.reports(pageNumber));}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 async showPreview(){if(!this.auth.hvCan('stats')||this.busy())return;this.error.set(null);this.success.set(null);this.preview.set(null);try{const v=this.input();this.busy.set(true);this.detail.set(null);this.preview.set(await this.api.stats({from:v.from,to:v.to,ward:v.ward,productCode:v.productCode}));}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async archive(){if(!this.auth.hvCan('archive')||this.busy())return;this.error.set(null);this.success.set(null);try{const v=this.input();if(!window.confirm('گزارش تجمیعی جدید با داده‌های زمان ثبت آرشیو شود؟'))return;this.busy.set(true);
 const id=await this.api.archive(v);this.detail.set(await this.api.reportDetail(id));this.preview.set(null);this.externalForm={status:'',reference:''};this.page.set(await this.api.reports(1));this.success.set('گزارش داخلی در آرشیو ثبت شد.');}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async open(id:string){if(!this.auth.hvCan('reports')||this.busy())return;this.busy.set(true);this.error.set(null);this.detail.set(null);this.preview.set(null);try{this.detail.set(await this.api.reportDetail(id));this.externalForm={status:'',reference:''};}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async recordExternal(){const d=this.detail(),v=this.externalForm;if(!d||!this.auth.hvCan('reportExternal')||this.busy())return;this.error.set(null);this.success.set(null);try{if(!v.status||v.status==='SentManually'&&!v.reference.trim())throw new Error('وضعیت و مرجع ارسال واقعی لازم است.');this.busy.set(true);
 await this.api.reportExternal(d.report.guid,d.report.version,v.status,v.reference||null);this.detail.set(await this.api.reportDetail(d.report.guid));this.page.set(await this.api.reports(this.page()?.pageNumber??1));this.success.set('وضعیت گزارش بیرونی ثبت شد.');}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 export(s:Summary){downloadCsv('hemo-hv-summary.csv',[['گروه','شاخص','تعداد'],['کل','پرونده',s.total],['کل','باز',s.open],['کل','بسته',s.closed],['کل','تزریق شروع‌شده',s.startedTransfers],['کل','CAPA باز',s.capaOpen],['کل','CAPA سررسید گذشته',s.capaOverdue],...([['تشخیص',s.byDiagnosis],['شدت',s.bySeverity],['بخش',s.byWard],['فرآورده',s.byProduct],['وضعیت',s.byStatus]] as const).flatMap(([group,rows])=>rows.map(x=>[group,x.key,x.count]))]);}
 print(){window.print();}
}
