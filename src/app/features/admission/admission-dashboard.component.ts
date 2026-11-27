import { AuthService } from '../../core/auth/auth.service';
import { Component,OnInit,inject,signal } from '@angular/core';
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
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent,AdmissionMetricsComponent,AdmissionTableComponent,AdmissionCreateComponent],template:`
<section class="heading"><p class="eyebrow">مدیریت پذیرش بیمارستان</p><h1>داشبورد پذیرش بیمارستان</h1><p class="muted">نمای یکپارچه تشکیل پرونده، وضعیت هویتی و ایمنی انتقال خون در مرکز جاری</p></section>
<app-request-state [loading]="busy()" [error]="error()"/><app-admission-metrics [stats]="stats()"/>
@if(auth.can('create')){<section class="panel"><div class="patient-title"><h2>پذیرش سریع بیمار</h2><button mat-flat-button class="primary-button" (click)="quick.set(!quick())">{{quick()?'بستن فرم':'＋ تشکیل پرونده جدید'}}</button></div>@if(quick()){<app-admission-create [compact]="true"/>}@else{<p class="muted">ثبت مشخصات، تشکیل پرونده و صدور شناسه مچ‌بند از یک فرم.</p><div class="page-links"><a routerLink="/admission/new">＋ پذیرش بیمار</a><a routerLink="/admission/identity">✓ تطبیق هویت</a><a routerLink="/admission/history">◷ بررسی سوابق</a><a routerLink="/admission/discharge">⇥ کنترل ترخیص</a></div>}</section>}
<section class="panel"><h2>استعلام فوری پرونده و سوابق ثبت‌شده</h2><form class="actions" (ngSubmit)="searchPatients()"><input name="search" [(ngModel)]="search" placeholder="نام، شماره پرونده، کد ملی یا بارکد" style="flex:1;min-width:160px"><button mat-flat-button class="primary-button" [disabled]="searching()">جستجو</button></form>
<app-request-state [loading]="searching()" [error]="searchError()"/>@if(results();as rows){<div class="table-wrap"><table><thead><tr><th>بیمار</th><th>پرونده</th><th>گروه خونی</th><th>هشدار</th><th></th></tr></thead><tbody>@for(p of rows;track p.guid){<tr><td>{{p.firstName}} {{p.lastName}}</td><td>{{p.hisNumber}}</td><td>{{p.bloodGroup||'ثبت نشده'}}</td><td>{{p.allergy||p.alloantibody||p.transfusionHistory==='Reaction'?'نیاز به بررسی سابقه':'—'}}</td><td><a mat-button routerLink="/admission/history" [queryParams]="{guid:p.guid}">بررسی سوابق</a></td></tr>}@empty{<tr><td colspan="5">پرونده‌ای پیدا نشد.</td></tr>}</tbody></table></div>}</section>
<section class="panel"><div class="patient-title"><h2>پذیرش‌های اخیر و وضعیت شناسه هویتی</h2><div class="actions"><button mat-stroked-button (click)="load()">به‌روزرسانی</button><a mat-button routerLink="/admission/list">همه پرونده‌ها</a></div></div><app-admission-table [rows]="recent()"/></section>
`})
export class AdmissionDashboardComponent implements OnInit{
 readonly auth=inject(AuthService);
 private api=inject(AdmissionsService);readonly stats=signal<AdmissionStats|null>(null);readonly recent=signal<AdmissionView[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly quick=signal(false);
 readonly results=signal<AdmissionView[]|null>(null);readonly searching=signal(false);readonly searchError=signal<string|null>(null);search='';
 ngOnInit(){void this.load();}
 async load(){this.busy.set(true);this.error.set(null);try{const [stats,page]=await Promise.all([this.api.stats(),this.api.list({pageNumber:1,pageSize:5})]);this.stats.set(stats);this.recent.set(page.data);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 async searchPatients(){if(!this.search.trim())return;this.searching.set(true);this.searchError.set(null);try{const p=await this.api.list({search:normalizeDigits(this.search).trim(),pageNumber:1,pageSize:10});this.results.set(p.data);}catch(e){this.searchError.set(message(e));this.results.set(null);}finally{this.searching.set(false);}}
}
