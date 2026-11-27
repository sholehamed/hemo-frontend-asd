import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionsService,AdmissionStats } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { AdmissionMetricsComponent } from './admission-metrics.component';
import { downloadCsv,fa,label,message,percentage } from '../../shared/admission-utils';
import { jalaliToIso } from '../../shared/jalali-date';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionMetricsComponent],template:`
@if(scopeValid()){
<section class="heading"><p class="eyebrow">پذیرش / گزارش‌های مدیریتی</p><h1>گزارشات تحلیلی پذیرش و ایمنی تزریق خون</h1><p class="muted">داده‌های واقعی پرونده‌های مرکز جاری؛ بدون آمار ساختگی</p></section>
<section class="panel no-print"><form class="form-grid" (ngSubmit)="load()"><label>از تاریخ جلالی<input [(ngModel)]="from" name="from" placeholder="۱۴۰۵/۰۱/۰۱" dir="ltr"></label><label>تا تاریخ جلالی<input [(ngModel)]="to" name="to" placeholder="۱۴۰۵/۰۹/۳۰" dir="ltr"></label><label>بخش درمانی<select [(ngModel)]="ward" name="ward"><option value="">همه بخش‌ها</option>@for(w of wards();track w){<option [value]="w">{{w}}</option>}</select></label><div class="actions"><button mat-flat-button class="primary-button" [disabled]="busy()">اعمال فیلتر</button><button mat-stroked-button type="button" (click)="reset()">بازنشانی</button></div></form></section>
<app-request-state [loading]="busy()" [error]="error()"/>
@if(stats();as x){<div class="actions no-print"><button mat-stroked-button (click)="print()">چاپ خروجی مدیریتی</button><button mat-stroked-button (click)="exportCsv()">خروجی CSV / اکسل</button></div>
<div class="print-target"><app-admission-metrics [stats]="x"/>
<div class="split"><section class="panel"><h2>توزیع پذیرش بر اساس بخش</h2>@for(w of x.wards;track w.name){<div class="bar-row"><span>{{w.name}}</span><div class="bar-track"><div class="bar-fill" [style.width.%]="percentage(w.count,x.total)"></div></div><strong>{{fa(w.count)}}</strong></div>}@empty{<p class="muted">داده‌ای وجود ندارد.</p>}</section>
<section class="panel"><h2>توزیع گروه خونی ثبت‌شده</h2>@for(g of x.bloodGroups;track g.name){<div class="bar-row"><span>{{label(g.name)}}</span><div class="bar-track"><div class="bar-fill" style="background:#0d8c7a" [style.width.%]="percentage(g.count,x.total)"></div></div><strong>{{fa(g.count)}}</strong></div>}@empty{<p class="muted">داده‌ای وجود ندارد.</p>}</section></div>
<section class="panel"><h2>پوشش تطبیق هویتی و آمادگی ترخیص</h2><div class="bar-row"><span>هویت تأیید شده</span><div class="bar-track"><div class="bar-fill" style="background:#0d8c7a" [style.width.%]="percentage(x.verified,x.total)"></div></div><strong>{{fa(percentage(x.verified,x.total))}}٪</strong></div><div class="bar-row"><span>آماده بررسی ترخیص</span><div class="bar-track"><div class="bar-fill" style="background:#d07800" [style.width.%]="percentage(x.ready,x.total)"></div></div><strong>{{fa(percentage(x.ready,x.total))}}٪</strong></div><p class="muted">آمار آمادگی ترخیص جایگزین آمار ترخیص قطعی یا گزارش تزریق خون نیست.</p></section></div>}
} @else {<section class="panel" role="alert"><p>نقش یا نشست تغییر کرده است. برای دریافت اطلاعات در محدوده جدید به صفحه اصلی برگردید.</p><a mat-button routerLink="/">بازگشت به صفحه اصلی</a></section>}
`})
export class AdmissionStatsComponent implements OnInit,OnDestroy{
 private scope=inject(HemoRoleLifecycle);private marker=this.scope.capture();private destroyed=false;private sequence=0;
 scopeValid(){return !this.destroyed&&this.scope.isCurrent(this.marker);}
 ngOnDestroy(){this.destroyed=true;++this.sequence;this.stats.set(null);this.wards.set([]);}

 private api=inject(AdmissionsService);readonly stats=signal<AdmissionStats|null>(null);readonly wards=signal<string[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly fa=fa;readonly percentage=percentage;readonly label=label;from='';to='';ward='';
 ngOnInit(){if(!this.scopeValid())return;void this.load();void this.api.stats().then(x=>{if(this.scopeValid())this.wards.set(x.wards.map(w=>w.name));}).catch(()=>{});}
 async load(){if(!this.scopeValid())return;const seq=++this.sequence;const from=this.from?jalaliToIso(this.from):null;const to=this.to?jalaliToIso(this.to):null;if((this.from&&!from)||(this.to&&!to)||(from&&to&&from>to)){this.error.set('بازه تاریخ معتبر نیست.');return;}this.busy.set(true);this.error.set(null);try{const result=await this.api.stats({from,to,ward:this.ward});if(this.scopeValid()&&seq===this.sequence)this.stats.set(result);}catch(e){if(this.scopeValid()&&seq===this.sequence){this.error.set(message(e));this.stats.set(null);}}finally{if(this.scopeValid()&&seq===this.sequence)this.busy.set(false);}}
 reset(){this.from=this.to=this.ward='';void this.load();}
 print(){if(this.scopeValid())window.print();}
 exportCsv(){if(!this.scopeValid())return;const x=this.stats();if(!x)return;downloadCsv('hemo-admission-stats.csv',[['شاخص','عنوان','تعداد'],['پذیرش','کل',x.total],['پذیرش','فعال',x.active],['هویت','تأیید',x.verified],['هویت','مغایرت',x.mismatch],['ترخیص','آمادگی بررسی',x.ready],...x.wards.map(w=>['بخش',w.name,w.count]),...x.bloodGroups.map(g=>['گروه خونی',label(g.name),g.count])]);}
}
