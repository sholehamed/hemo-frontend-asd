import {Component,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import {QualityPageAccess} from './quality-page-access';
import {QualityService} from '../../core/api/quality.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime} from '../blood-bank/bank-time';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {Incident,URGENCIES,QUALITY_STATUS,statusColor} from './quality-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,QualityService,QualityPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],template:`
@if(scope.isCurrent()){
<section class="heading"><p class="eyebrow">HEMO / تجهیزات</p><h1>حوادث و خرابی تجهیزات</h1></section>
@if(auth.loading()){<app-request-state [loading]="true" [error]="null"/>}@else if(!auth.qualityCan('incidents')){<section class="panel"><h2>مجوز مشاهده حوادث ندارید.</h2></section>}@else{
<div class="actions no-print">@if(auth.qualityCan('equipmentList')){<a mat-flat-button class="primary-button" routerLink="/hemo/quality/equipment">انتخاب تجهیز</a>}</div><section class="panel no-print"><form class="actions" (ngSubmit)="load()"><label>جستجوی کد یا نام<input name="search" [(ngModel)]="search"></label><label>وضعیت<select name="status" [(ngModel)]="filter"><option value="">همه</option><option value="Open">باز</option><option value="Resolved">رفع نقص ثبت‌شده</option></select></label><button mat-flat-button class="primary-button" [disabled]="busy()">جستجو</button></form></section>
<app-request-state [loading]="busy()" [error]="error()"/>@if(page();as p){<section class="panel print-target"><div class="patient-title"><h2>{{fa(p.totalCount)}} حادثه</h2><button mat-stroked-button class="no-print" (click)="export()">CSV صفحه جاری</button></div><div class="table-wrap"><table><thead><tr><th>شماره پیگیری</th><th>تجهیز</th><th>شرح</th><th>فوریت ثبت‌شده</th><th>زمان</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>@for(i of p.data;track i.guid){<tr><td class="mono">{{i.incidentNumber}}</td><td>{{i.equipmentName}} / {{i.code}}</td><td>{{i.description}}</td><td>{{urgencies[i.urgency]}}</td><td>{{date(i.reportedAt)}}</td><td><span class="status-pill" [class]="color(i.status)">{{statuses[i.status]}}</span></td><td>@if(auth.qualityCan('equipmentDetail')){<a mat-button [routerLink]="['/hemo/quality/equipment',i.equipmentGuid]">جزئیات تجهیز</a>}</td></tr>}@empty{<tr><td colspan="7">حادثه‌ای یافت نشد.</td></tr>}</tbody></table></div><div class="pagination no-print"><button mat-button [disabled]="busy()||!p.hasPreviousPage" (click)="load(p.pageNumber-1)">قبلی</button><span>{{fa(p.pageNumber)}} / {{fa(p.totalPages)}}</span><button mat-button [disabled]="busy()||!p.hasNextPage" (click)="load(p.pageNumber+1)">بعدی</button></div></section>}}
} @else {<p role="alert">نقش یا نشست تغییر کرده است.</p>}
`})
export class EquipmentIncidentsComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(QualityPageAccess);private api=inject(QualityService);readonly page=signal<BankPage<Incident>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly fa=fa;readonly date=bankDateTime;readonly statuses=QUALITY_STATUS;readonly urgencies=URGENCIES;readonly color=statusColor;
 search='';filter='Open';private applied={search:'',status:'Open'};
 async ngOnInit(){await this.auth.load();if(this.scope.isCurrent())await this.load();}
 ngOnDestroy(){this.scope.invalidate();this.page.set(null);}
 async load(pageNumber=1){if(this.busy()||!this.auth.qualityCan('incidents'))return;this.busy.set(true);this.error.set(null);this.page.set(null);try{if(pageNumber===1)this.applied={search:this.search,status:this.filter};const p=await this.api.incidents({...this.applied,pageNumber,pageSize:20});if(this.scope.isCurrent())this.page.set(p);}catch(e){if(this.scope.isCurrent())this.error.set(message(e));}finally{if(this.scope.isCurrent())this.busy.set(false);}}
 export(){const p=this.page();if(p&&this.auth.qualityCan('incidents')&&!this.busy())downloadCsv('hemo-equipment-incidents.csv',[['حادثه','تجهیز','شرح','فوریت','وضعیت'],...p.data.map(x=>[x.incidentNumber,x.code,x.description,x.urgency,x.status])]);}
}
