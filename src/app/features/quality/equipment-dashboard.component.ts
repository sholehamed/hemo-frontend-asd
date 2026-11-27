import {Component,OnInit,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message} from '../../shared/admission-utils';
import {EquipmentSummary} from './quality-model';
@Component({standalone:true,imports:[RouterLink,MatButtonModule,RequestStateComponent],template:`
<section class="heading"><p class="eyebrow">HEMO / تجهیزات</p><h1>داشبورد تجهیزات و زنجیره سرما</h1><p class="muted">بر اساس سوابق ثبت‌شده؛ این صفحه پایش زنده حسگر نیست.</p></section>
@if(!auth.qualityCan('equipmentStats')){<section class="panel"><h2>مجوز آمار تجهیزات ندارید.</h2></section>}@else{
<div class="actions no-print"><a mat-flat-button class="primary-button" routerLink="/hemo/quality/equipment">شناسنامه تجهیزات</a><a mat-stroked-button routerLink="/hemo/quality/maintenance">کارتابل سررسید</a>@if(auth.qualityCan('incidents')){<a mat-stroked-button routerLink="/hemo/quality/incidents">حوادث</a>}<button mat-stroked-button (click)="load()" [disabled]="busy()">به‌روزرسانی</button></div>
<app-request-state [loading]="busy()" [error]="error()"/>@if(summary();as s){<div class="metric-grid">@for(m of metrics(s);track m[0]){<div class="metric"><span>{{m[0]}}</span><strong>{{fa(m[1])}}</strong></div>}</div>
<section class="panel"><h2>کدهای تاریخی فاقد شناسنامه</h2><p>کدهای موجودی و دمای قبلی بدون دستکاری داده‌ها نمایش داده می‌شوند. مسئول تجهیز باید مستندات واقعی را بررسی و شناسنامه ثبت کند.</p><div class="table-wrap"><table><thead><tr><th>کد</th><th>عملیات</th></tr></thead><tbody>@for(code of s.unregisteredCodes;track code){<tr><td class="mono">{{code}}</td><td><a mat-button routerLink="/hemo/quality/equipment" [queryParams]="{search:code}">بررسی / ثبت شناسنامه</a></td></tr>}@empty{<tr><td colspan="2">کد فاقد شناسنامه‌ای یافت نشد.</td></tr>}</tbody></table></div></section>}}
`})
export class EquipmentDashboardComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(QualityService);readonly summary=signal<EquipmentSummary|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly fa=fa;
 metrics(s:EquipmentSummary):[string,number][]{return [['کل تجهیزات',s.total],['عملیاتی',s.operational],['توقف فنی',s.hold],['آرشیو',s.archived],['سررسید گذشته',s.serviceDue],['حادثه باز',s.openIncidents],['کد فاقد شناسنامه',s.legacyCodes]];}
 ngOnInit(){if(this.auth.qualityCan('equipmentStats'))void this.load();}
 async load(){if(this.busy())return;this.busy.set(true);this.error.set(null);try{this.summary.set(await this.api.equipmentStats());}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
