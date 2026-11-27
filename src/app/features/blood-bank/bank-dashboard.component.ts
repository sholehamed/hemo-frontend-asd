import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { BankPageAccess } from './bank-page-access';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BankStats,UnitRow,TemperatureView,statusLabel } from './bank-model';
import { fa,message,downloadCsv,BLOOD_GROUPS } from '../../shared/admission-utils';
import { productLabel,REQUEST_PRODUCTS } from '../blood-requests/blood-request-model';
import { bankDateTime } from './bank-time';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodBankService,BankPageAccess],imports:[RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-dashboard.component.html'})
export class BankDashboardComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(BankPageAccess);private api=inject(BloodBankService);private route=inject(ActivatedRoute);readonly report=this.route.snapshot.data['report']===true;
 readonly stats=signal<BankStats|null>(null);readonly expiry=signal<UnitRow[]>([]);readonly temps=signal<TemperatureView[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly expiryError=signal<string|null>(null);readonly temperatureError=signal<string|null>(null);
 readonly groups=BLOOD_GROUPS;readonly products=REQUEST_PRODUCTS;readonly fa=fa;readonly product=productLabel;readonly date=bankDateTime;readonly status=statusLabel;
 private seq=0;
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){await this.auth.load();if(this.scope.isCurrent())await this.load();}
 ngOnDestroy(){this.scope.invalidate();++this.seq;this.stats.set(null);this.expiry.set([]);this.temps.set([]);}
 async load(){
   if(!this.auth.bankCan('stats'))return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.expiryError.set(null);this.temperatureError.set(null);this.stats.set(null);this.expiry.set([]);this.temps.set([]);
   const tasks=[this.api.stats().then(s=>{if(this.current(seq))this.stats.set(s);}).catch(e=>{if(this.current(seq))this.error.set(message(e));})];
   if(this.auth.bankCan('inventory'))tasks.push(this.api.inventory({status:'ExpiringSoon',pageSize:10}).then(p=>{if(this.current(seq))this.expiry.set(p.data);}).catch(e=>{if(this.current(seq))this.expiryError.set(message(e));}));
   if(this.auth.bankCan('temperatureHistory'))tasks.push(this.api.temperatures({pageSize:10}).then(p=>{if(this.current(seq))this.temps.set(p.data);}).catch(e=>{if(this.current(seq))this.temperatureError.set(message(e));}));
   try{await Promise.all(tasks);}finally{if(this.current(seq))this.busy.set(false);}
 }
 metrics(s:BankStats){return [{label:'موجودی آزاد',n:s.available,kind:'good'},{label:'رزروشده',n:s.reserved,kind:'warn'},{label:'در حال ذوب',n:s.thawing,kind:'warn'},{label:'آماده بررسی تحویل',n:s.ready,kind:'good'},{label:'در انتظار بازرسی / قرنطینه',n:s.hold,kind:'danger'},{label:'مسدود فنی تجهیز',n:s.equipmentBlocked??0,kind:'danger'},{label:'منقضی',n:s.expired,kind:'danger'},{label:'نزدیک انقضا',n:s.expiringSoon,kind:'warn'},{label:'درخواست تأیید شده',n:s.approvedRequests,kind:''},{label:'نگرانی دما (۲۴ ساعت)',n:s.temperatureConcerns,kind:'danger'},{label:'امحای ثبت‌شده',n:s.discarded,kind:''}];}
 stock(s:BankStats,product:string,group:string){return s.stock?.find(x=>x.productCode===product&&x.bloodGroup===group)?.available??0;}
 stockTotal(s:BankStats,product:string){return this.groups.reduce((n,g)=>n+this.stock(s,product,g),0);}
 exportStock(){const s=this.stats();if(s&&this.auth.bankCan('stats')&&!this.busy())downloadCsv('hemo-bank-stock.csv',[['فرآورده',...this.groups,'جمع'],...this.products.map(p=>[p.label,...this.groups.map(g=>this.stock(s,p.code,g)),this.stockTotal(s,p.code)])]);}
 export(){const s=this.stats();if(s&&this.auth.bankCan('stats')&&!this.busy())downloadCsv('hemo-bank-summary.csv',[['شاخص','تعداد'],...this.metrics(s).map(x=>[x.label,x.n])]);}
 print(){if(this.auth.bankCan('stats')&&this.stats()&&!this.busy())window.print();}
}
