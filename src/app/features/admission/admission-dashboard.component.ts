import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { AdmissionPageAccess } from './admission-page-access';
import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AdmissionStats,AdmissionView,AdmissionsService } from '../../core/api/admissions.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { AdmissionMetricsComponent } from './admission-metrics.component';
import { AdmissionTableComponent } from './admission-table.component';
import { AdmissionCreateComponent } from './admission-create.component';
import { message } from '../../shared/admission-utils';
import { normalizeDigits } from '../../shared/jalali-date';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,AdmissionsService,AdmissionPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionMetricsComponent,AdmissionTableComponent,AdmissionCreateComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">مدیریت پذیرش بیمارستان</p><h1>داشبورد پذیرش بیمارستان</h1><p class="muted">نمای یکپارچه تشکیل پرونده، وضعیت هویتی و ایمنی انتقال خون در مرکز جاری</p></section>
<app-request-state [loading]="busy()||auth.loading()" [error]="error()"/>
@if(auth.can('stats')){<app-request-state [loading]="statsBusy()" [error]="statsError()"/><app-admission-metrics [stats]="stats()"/><a mat-button routerLink="/admission/stats">گزارش‌های پذیرش</a>}
@if(auth.can('list')||auth.can('stats')){<button mat-stroked-button (click)="load()" [disabled]="busy()||quick()">به‌روزرسانی داشبورد</button>}
@if(canCreate()){<section class="panel"><div class="patient-title"><h2>پذیرش سریع بیمار</h2><button mat-flat-button class="primary-button" (click)="quick.set(!quick())">{{quick()?'بستن فرم':'＋ تشکیل پرونده جدید'}}</button></div>@if(quick()){<app-admission-create [compact]="true"/>}@else{<p class="muted">ثبت مشخصات، تشکیل پرونده و صدور شناسه مچ‌بند از یک فرم.</p><div class="page-links"><a routerLink="/admission/new">＋ پذیرش بیمار</a>@if(canReview()){<a routerLink="/admission/identity">✓ تطبیق هویت</a>@if(auth.can('history')){<a routerLink="/admission/history">◷ بررسی سوابق</a>}<a routerLink="/admission/discharge">⇥ کنترل ترخیص</a>}</div>}</section>}
@if(auth.can('list')){<section class="panel"><h2>استعلام فوری پرونده و سوابق ثبت‌شده</h2><form class="actions" (ngSubmit)="searchPatients()"><input name="search" [(ngModel)]="search" placeholder="نام، شماره پرونده، کد ملی یا بارکد" style="flex:1;min-width:160px"><button mat-flat-button class="primary-button" [disabled]="searching()">جستجو</button></form>
<app-request-state [loading]="searching()" [error]="searchError()"/>@if(results();as rows){<div class="table-wrap"><table><thead><tr><th>بیمار</th><th>پرونده</th><th>گروه خونی</th><th>هشدار</th><th></th></tr></thead><tbody>@for(p of rows;track p.guid){<tr><td>{{p.firstName}} {{p.lastName}}</td><td>{{p.hisNumber}}</td><td>{{p.bloodGroup||'ثبت نشده'}}</td><td>{{p.allergy||p.alloantibody||p.transfusionHistory==='Reaction'?'نیاز به بررسی سابقه':'—'}}</td><td>@if(canReview()&&auth.can('history')){<a mat-button routerLink="/admission/history" [queryParams]="{guid:p.guid}">بررسی سوابق</a>}@else if(auth.can('detail')){<a mat-button [routerLink]="['/admission/detail',p.guid]">جزئیات</a>}</td></tr>}@empty{<tr><td colspan="5">پرونده‌ای پیدا نشد.</td></tr>}</tbody></table></div>}</section>
<section class="panel"><div class="patient-title"><h2>پذیرش‌های اخیر و وضعیت شناسه هویتی</h2><div class="actions"><button mat-stroked-button (click)="load()" [disabled]="busy()||quick()">به‌روزرسانی</button><a mat-button routerLink="/admission/list">همه پرونده‌ها</a></div></div><app-request-state [loading]="listBusy()" [error]="listError()"/><app-admission-table [rows]="recent()" [showActions]="auth.can('detail')" [showIdentityAction]="canReview()"/></section>}
@if(!auth.loading()&&!auth.can('list')&&!auth.can('stats')&&!canCreate()){<p role="alert">دسترسی به داده‌های داشبورد تأیید نشده است.</p>}
} @else {<p role="alert">نقش یا نشست تغییر کرده است. <a routerLink="/">بازگشت به صفحه اصلی</a></p>}
`})
export class AdmissionDashboardComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(AdmissionPageAccess);
 private api=inject(AdmissionsService);
 readonly stats=signal<AdmissionStats|null>(null);readonly recent=signal<AdmissionView[]>([]);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly quick=signal(false);
 readonly statsBusy=signal(false);readonly listBusy=signal(false);readonly statsError=signal<string|null>(null);readonly listError=signal<string|null>(null);
 readonly results=signal<AdmissionView[]|null>(null);readonly searching=signal(false);readonly searchError=signal<string|null>(null);search='';
 private seq=0;private searchSeq=0;
 canCreate(){return this.auth.can('create')&&this.auth.can('find')&&this.auth.can('detail');}
 canReview(){return this.auth.can('list')&&this.auth.can('detail')&&this.auth.can('reviews');}
 private current(seq:number){return this.scope.isCurrent()&&this.seq===seq;}
 ngOnInit(){void this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.seq;++this.searchSeq;this.stats.set(null);this.recent.set([]);this.results.set(null);this.search='';}
 async load(){
   if(!this.scope.isCurrent()||this.busy()||this.quick())return;
   const seq=++this.seq;++this.searchSeq;
   this.busy.set(true);this.error.set(null);this.stats.set(null);this.recent.set([]);this.results.set(null);
   this.searching.set(false);this.searchError.set(null);this.statsError.set(null);this.listError.set(null);
   try{
     await this.auth.load();
     if(!this.current(seq))return;
     const tasks:Promise<void>[]=[];
     if(this.auth.can('stats')){
       this.statsBusy.set(true);
       tasks.push(this.api.stats().then(data=>{if(this.current(seq))this.stats.set(data);})
         .catch(e=>{if(this.current(seq))this.statsError.set(message(e));})
         .finally(()=>{if(this.current(seq))this.statsBusy.set(false);}));
     }
     if(this.auth.can('list')){
       this.listBusy.set(true);
       tasks.push(this.api.list({pageNumber:1,pageSize:5}).then(page=>{if(this.current(seq))this.recent.set(page.data);})
         .catch(e=>{if(this.current(seq))this.listError.set(message(e));})
         .finally(()=>{if(this.current(seq))this.listBusy.set(false);}));
     }
     await Promise.all(tasks);
   }catch(e){if(this.current(seq))this.error.set(message(e));}
   finally{if(this.current(seq))this.busy.set(false);}
 }
 async searchPatients(){
   if(!this.auth.can('list')||!this.search.trim())return;
   const seq=this.seq,n=++this.searchSeq;
   const current=()=>this.current(seq)&&n===this.searchSeq;
   this.searching.set(true);this.searchError.set(null);this.results.set(null);
   try{const p=await this.api.list({search:normalizeDigits(this.search).trim(),pageNumber:1,pageSize:10});if(current())this.results.set(p.data);}
   catch(e){if(current())this.searchError.set(message(e));}
   finally{if(current())this.searching.set(false);}
 }
}
