import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { TransferPageAccess } from './transfer-page-access';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { bankDateTime } from '../blood-bank/bank-time';
import { TransferRow,TransferStats,STATUSES,statusClass } from './transfer-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,TransfusionService,TransferPageAccess],imports:[RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-dashboard.component.html'})
export class TransferDashboardComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(TransferPageAccess);private api=inject(TransfusionService);readonly stats=signal<TransferStats|null>(null);readonly recent=signal<TransferRow[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly recentError=signal<string|null>(null);
 readonly fa=fa;readonly statuses=STATUSES;readonly color=statusClass;readonly date=bankDateTime;
 private seq=0;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){await this.auth.load();if(this.scope.isCurrent())await this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.seq;this.stats.set(null);this.recent.set([]);}
 async load(){
   if(!this.auth.transferCan('stats'))return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.recentError.set(null);this.stats.set(null);this.recent.set([]);
   const tasks=[this.api.stats().then(s=>{if(this.current(seq))this.stats.set(s);}).catch(e=>{if(this.current(seq))this.error.set(message(e));})];
   if(this.auth.transferCan('list'))tasks.push(this.api.list({pageSize:8}).then(p=>{if(this.current(seq))this.recent.set(p.data);}).catch(e=>{if(this.current(seq))this.recentError.set(message(e));}));
   try{await Promise.all(tasks);}finally{if(this.current(seq))this.busy.set(false);}
 }
 metrics(s:TransferStats){return [{label:'کل حواله‌ها',value:s.total},{label:'در مسیر بخش',value:s.dispatched},{label:'دریافت / تطبیق',value:s.received+s.verified+s.witnessed},{label:'در حال تزریق',value:s.inProgress},{label:'پایان ثبت‌شده',value:s.completed},{label:'مغایرت / توقف',value:s.receiptHold+s.stopped},{label:'در مسیر برگشت',value:s.returning},{label:'مرجوع / امحا',value:s.returned+s.disposed},{label:'نگرانی ثبت‌شده',value:s.suspectedReactions}];}
 export(){const s=this.stats();if(s&&this.auth.transferCan('stats')&&!this.busy())downloadCsv('hemo-transfer-stats.csv',[['شاخص','تعداد'],...this.metrics(s).map(x=>[x.label,x.value])]);}
 print(){if(this.auth.transferCan('stats')&&this.stats()&&!this.busy())window.print();}
}
