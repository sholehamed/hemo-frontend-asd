import {Component,OnInit,inject,signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {message} from '../../shared/admission-utils';
import {bankDateTime} from '../blood-bank/bank-time';
import {CaseRow,Summary,STATUS,statusColor} from './hv-model';
import {HvMetricsComponent} from './hv-metrics.component';
@Component({standalone:true,imports:[RouterLink,MatButtonModule,RequestStateComponent,HvMetricsComponent],template:`
<section class="heading"><p class="eyebrow">HEMO / ST-06</p><h1>داشبورد هموویژیلانس</h1><p class="muted">پرونده واکنش، بررسی مسئول، تحلیل علت و پیگیری اثربخشی اقدامات.</p></section>
@if(!auth.hvCan('stats')){<section class="panel"><h2>مجوز مشاهده آمار ندارید.</h2></section>}@else{
<div class="actions no-print">@if(auth.hvCan('report')){<a mat-flat-button class="primary-button" routerLink="/hemo/hv/new">＋ گزارش واکنش جدید</a>}@if(auth.hvCan('list')){<a mat-stroked-button routerLink="/hemo/hv/cases">پرونده‌ها</a>}@if(auth.hvCan('reports')){<a mat-stroked-button routerLink="/hemo/hv/reports">گزارش دوره‌ای</a>}<button mat-stroked-button (click)="load()" [disabled]="busy()">به‌روزرسانی</button></div>
<app-request-state [loading]="busy()" [error]="error()"/>
@if(summary();as s){<app-hv-metrics [data]="s"/>}
@if(auth.hvCan('list')){<section class="panel"><div class="patient-title"><h2>پرونده‌های باز اخیر</h2><a mat-button routerLink="/hemo/hv/cases">همه پرونده‌ها</a></div><div class="table-wrap"><table><thead><tr><th>پرونده</th><th>بیمار / بخش</th><th>بروز</th><th>وضعیت</th></tr></thead><tbody>@for(r of recent();track r.guid){<tr><td>@if(auth.hvCan('detail')){<a [routerLink]="['/hemo/hv/detail',r.guid]">{{r.caseNumber}}</a>}@else{ {{r.caseNumber}} }</td><td>{{r.patientName}} / {{r.ward}}</td><td>{{date(r.onsetAt)}}</td><td><span class="status-pill" [class]="color(r.status)">{{statuses[r.status]}}</span></td></tr>}@empty{<tr><td colspan="4">پرونده باز وجود ندارد.</td></tr>}</tbody></table></div></section>}}
`})
export class HvDashboardComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(HemovigilanceService);readonly summary=signal<Summary|null>(null);readonly recent=signal<CaseRow[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly statuses=STATUS;readonly color=statusColor;readonly date=bankDateTime;
 ngOnInit(){if(this.auth.hvCan('stats'))void this.load();}
 async load(){if(!this.auth.hvCan('stats'))return;this.busy.set(true);this.error.set(null);try{const [s,r]=await Promise.all([this.api.stats(),this.auth.hvCan('list')?this.api.list({status:'Open',pageSize:8}):Promise.resolve(null)]);this.summary.set(s);this.recent.set(r?.data??[]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
