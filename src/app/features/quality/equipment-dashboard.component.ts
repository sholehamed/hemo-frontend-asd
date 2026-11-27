import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message} from '../../shared/admission-utils';
import {EquipmentSummary} from './quality-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[RouterLink,MatButtonModule,RequestStateComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">HEMO / تجهیزات</p><h1>داشبورد تجهیزات و زنجیره سرما</h1><p class="muted">بر اساس سوابق ثبت‌شده؛ این صفحه پایش زنده حسگر نیست.</p></section>
@if(auth.loading()){<app-request-state [loading]="true" [error]="null"/>}@else if(!auth.qualityCan('equipmentStats')){<section class="panel"><h2>مجوز آمار تجهیزات ندارید.</h2></section>}@else{
<div class="actions no-print">@if(auth.qualityCan('equipmentList')){<a mat-flat-button class="primary-button" routerLink="/hemo/quality/equipment">شناسنامه تجهیزات</a>}@if(auth.qualityCan('equipmentList')&&auth.qualityCan('equipmentService')){<a mat-stroked-button routerLink="/hemo/quality/maintenance">کارتابل سررسید</a>}@if(auth.qualityCan('equipmentList')&&auth.qualityCan('equipmentTemperature')){<a mat-stroked-button routerLink="/hemo/quality/temperature">پایش دما</a>}@if(auth.qualityCan('incidents')){<a mat-stroked-button routerLink="/hemo/quality/incidents">حوادث</a>}<button mat-stroked-button (click)="load()" [disabled]="busy()">به‌روزرسانی</button></div>
<app-request-state [loading]="busy()" [error]="error()"/>@if(summary();as s){<div class="metric-grid">@for(m of metrics(s);track m[0]){<div class="metric"><span>{{m[0]}}</span><strong>{{fa(m[1])}}</strong></div>}</div>
<section class="panel"><h2>کدهای تاریخی فاقد شناسنامه</h2><p>کدهای موجودی و دمای قبلی بدون دستکاری داده‌ها نمایش داده می‌شوند. مسئول تجهیز باید مستندات واقعی را بررسی و شناسنامه ثبت کند.</p><div class="table-wrap"><table><thead><tr><th>کد</th><th>عملیات</th></tr></thead><tbody>@for(code of s.unregisteredCodes;track code){<tr><td class="mono">{{code}}</td><td>@if(auth.qualityCan('equipmentList')){<a mat-button routerLink="/hemo/quality/equipment" [queryParams]="{search:code}">بررسی شناسنامه</a>}</td></tr>}@empty{<tr><td colspan="2">کد فاقد شناسنامه‌ای یافت نشد.</td></tr>}</tbody></table></div></section>}}
} @else {<p role="alert">نقش یا نشست تغییر کرده است.</p>}
`})
export class EquipmentDashboardComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);readonly summary=signal<EquipmentSummary|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly fa=fa;
 metrics(s:EquipmentSummary):[string,number][]{return [['کل تجهیزات',s.total],['عملیاتی',s.operational],['توقف فنی',s.hold],['آرشیو',s.archived],['سررسید گذشته',s.serviceDue],['حادثه باز',s.openIncidents],['کد فاقد شناسنامه',s.legacyCodes]];}
 async ngOnInit(){await this.auth.load();if(this.scope.isCurrent())await this.load();}
 ngOnDestroy(){this.scope.invalidate();this.summary.set(null);}
 async load(){if(!this.auth.qualityCan('equipmentStats')||this.busy())return;this.busy.set(true);this.error.set(null);this.summary.set(null);try{const s=await this.api.equipmentStats();if(this.scope.isCurrent())this.summary.set(s);}catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.busy.set(false);}}
}
