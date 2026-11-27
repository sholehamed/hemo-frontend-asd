import { Component,OnInit,inject,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { bankDateTime } from '../blood-bank/bank-time';
import { TransferRow,TransferStats,STATUSES,statusClass } from './transfer-model';
@Component({standalone:true,imports:[RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-dashboard.component.html'})
export class TransferDashboardComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(TransfusionService);readonly stats=signal<TransferStats|null>(null);readonly recent=signal<TransferRow[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly fa=fa;readonly statuses=STATUSES;readonly color=statusClass;readonly date=bankDateTime;
 ngOnInit(){if(this.auth.transferCan('stats'))void this.load();}
 async load(){if(!this.auth.transferCan('stats'))return;this.busy.set(true);this.error.set(null);try{const [s,r]=await Promise.all([this.api.stats(),this.auth.transferCan('list')?this.api.list({pageSize:8}):Promise.resolve(null)]);this.stats.set(s);this.recent.set(r?.data??[]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 metrics(s:TransferStats){return [{label:'کل حواله‌ها',value:s.total},{label:'در مسیر بخش',value:s.dispatched},{label:'دریافت / تطبیق',value:s.received+s.verified+s.witnessed},{label:'در حال تزریق',value:s.inProgress},{label:'پایان ثبت‌شده',value:s.completed},{label:'مغایرت / توقف',value:s.receiptHold+s.stopped},{label:'در مسیر برگشت',value:s.returning},{label:'مرجوع / امحا',value:s.returned+s.disposed},{label:'نگرانی ثبت‌شده',value:s.suspectedReactions}];}
 export(){const s=this.stats();if(s)downloadCsv('hemo-transfer-stats.csv',[['شاخص','تعداد'],...this.metrics(s).map(x=>[x.label,x.value])]);}
 print(){window.print();}
}
