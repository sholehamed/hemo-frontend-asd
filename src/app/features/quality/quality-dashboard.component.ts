import {Component,OnInit,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {localFields,toUtc} from '../blood-bank/bank-time';
import {productLabel} from '../blood-requests/blood-request-model';
import {QualityStats,Facility} from './quality-model';
@Component({standalone:true,imports:[FormsModule,MatButtonModule,RequestStateComponent],template:`
<section class="heading"><p class="eyebrow">HEMO / گزارش مدیریت کیفیت</p><h1>داشبورد و گزارش عملیاتی مرکز</h1></section>
@if(!auth.qualityCan('stats')){<section class="panel"><h2>مجوز آمار مدیریتی ندارید.</h2></section>}@else{
<section class="panel no-print"><h2>بازه گزارش</h2><form class="form-grid" (ngSubmit)="load()"><label>از تاریخ شمسی *<input name="from" [(ngModel)]="fromDate" required dir="ltr"></label><label>تا تاریخ شمسی *<input name="to" [(ngModel)]="toDate" required dir="ltr"></label><label>بخش (اختیاری)<input name="ward" [(ngModel)]="ward"></label><button mat-flat-button class="primary-button" [disabled]="busy()">تولید گزارش</button></form></section><app-request-state [loading]="busy()" [error]="error()"/>
@if(data();as s){<div class="print-target"><section class="panel"><div class="patient-title"><h2>{{profile()?.facilityName||'گزارش داخلی مرکز'}}</h2><div class="actions no-print"><button mat-stroked-button (click)="export(s)">CSV گزارش</button><button mat-stroked-button (click)="print()">چاپ / PDF مرورگر</button></div></div><p>{{applied}}</p><div class="notice info">دریافت و امحا در سطح کل مرکز و شروع/پایان تزریق مطابق بخش انتخاب‌شده شمارش می‌شوند. این گزارش نرخ C/T، سقف MSBOS یا انطباق بالینی را استنتاج نمی‌کند.</div></section>
<div class="metric-grid">@for(m of metrics(s);track m[0]){<div class="metric"><span>{{m[0]}}</span><strong>{{fa(m[1])}}</strong></div>}</div>
<section class="panel"><h2>مصرف و گردش فرآورده‌ها</h2><div class="table-wrap"><table><thead><tr><th>فرآورده</th><th>دریافت مرکز</th><th>شروع تزریق</th><th>پایان ثبت‌شده</th><th>امحای مرکز</th></tr></thead><tbody>@for(r of s.products;track r.productCode){<tr><td>{{product(r.productCode)}}</td><td>{{fa(r.received)}}</td><td>{{fa(r.started)}}</td><td>{{fa(r.completed)}}</td><td>{{fa(r.discarded)}}</td></tr>}@empty{<tr><td colspan="5">داده‌ای در بازه گزارش وجود ندارد.</td></tr>}</tbody></table></div></section>
<section class="panel"><h2>پایان تزریق ثبت‌شده به تفکیک بخش</h2>@for(r of s.completedByWard;track r.key){<div class="q-bar-label"><span>{{r.key}}</span><strong>{{fa(r.count)}}</strong></div><div class="q-bar"><span [style.width.%]="bar(r.count,s)"></span></div>}@empty{<p class="muted">داده‌ای ثبت نشده است.</p>}</section>
@if(profile()?.reportFooter){<section class="panel"><p>{{profile()?.reportFooter}}</p></section>}</div>}
}
`,styles:[`.q-bar-label{display:flex;justify-content:space-between;margin-top:10px}.q-bar{height:9px;background:#f0e4e7;border-radius:5px;overflow:hidden}.q-bar span{display:block;height:100%;background:#c8102e}`]})
export class QualityDashboardComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(QualityService);readonly data=signal<QualityStats|null>(null);readonly profile=signal<Facility|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly fa=fa;readonly product=productLabel;
 fromDate=localFields(new Date(Date.now()-86400000*30).toISOString()).date;toDate=localFields().date;ward='';applied='';
 metrics(s:QualityStats):[string,number][]{return [['QC',s.qcRecords],['QC در انتظار بازبینی',s.qcAwaitingReview],['جلسه کمیته',s.committeeMeetings],['مصوبه باز',s.openResolutions],['مصوبه معوق',s.overdueResolutions],['ممیزی',s.audits],['دوره آموزش',s.trainingCourses],['رکورد حضور بازبینی‌شده',s.attendanceRecords],['حضور ثبت‌شده',s.present],['حادثه تجهیز',s.equipmentIncidents],['واکنش ثبت‌شده',s.reactionCases]];}
 bar(v:number,s:QualityStats){return v/Math.max(1,...s.completedByWard.map(x=>x.count))*100;}
 ngOnInit(){if(this.auth.qualityCan('stats'))void this.load();}
 async load(){if(!this.auth.qualityCan('stats')||this.busy())return;this.busy.set(true);this.error.set(null);try{const from=toUtc(this.fromDate,'00:00'),to=new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString();if(Date.parse(from)>Date.parse(to))throw new Error('بازه زمانی معتبر نیست.');this.data.set(await this.api.stats({from,to,ward:this.ward}));this.applied=this.fromDate+' تا '+this.toDate+' / '+(this.ward||'همه بخش‌ها');if(this.auth.qualityCan('facility'))try{this.profile.set(await this.api.facility());}catch{/* stats remain usable */}}catch(e){this.data.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 export(s:QualityStats){downloadCsv('hemo-quality-stats.csv',[['بازه',this.applied],['شاخص','تعداد'],...this.metrics(s),['فرآورده','دریافت مرکز','شروع','پایان','امحا مرکز'],...s.products.map(r=>[r.productCode,r.received,r.started,r.completed,r.discarded]),['بخش','پایان'],...s.completedByWard.map(x=>[x.key,x.count])]);}
 print(){window.print();}
}
