import { Component,OnInit,inject,signal } from '@angular/core';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BankStats,UnitRow,TemperatureView,statusLabel } from './bank-model';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { bankDateTime } from './bank-time';
@Component({standalone:true,imports:[RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-dashboard.component.html'})
export class BankDashboardComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodBankService);private route=inject(ActivatedRoute);readonly report=this.route.snapshot.data['report']===true;
 readonly stats=signal<BankStats|null>(null);readonly expiry=signal<UnitRow[]>([]);readonly temps=signal<TemperatureView[]>([]);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly fa=fa;readonly product=productLabel;readonly date=bankDateTime;readonly status=statusLabel;
 ngOnInit(){if(this.auth.bankCan('stats'))void this.load();}
 async load(){if(!this.auth.bankCan('stats'))return;this.busy.set(true);this.error.set(null);try{const [s,e,t]=await Promise.all([this.api.stats(),this.auth.bankCan('inventory')?this.api.inventory({status:'ExpiringSoon',pageSize:10}):Promise.resolve(null),this.auth.bankCan('temperatureHistory')?this.api.temperatures({pageSize:10}):Promise.resolve(null)]);this.stats.set(s);this.expiry.set(e?.data??[]);this.temps.set(t?.data??[]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 metrics(s:BankStats){return [{label:'موجودی آزاد',n:s.available,kind:'good'},{label:'رزروشده',n:s.reserved,kind:'warn'},{label:'در حال ذوب',n:s.thawing,kind:'warn'},{label:'آماده بررسی تحویل',n:s.ready,kind:'good'},{label:'در انتظار بازرسی / قرنطینه',n:s.hold,kind:'danger'},{label:'منقضی',n:s.expired,kind:'danger'},{label:'نزدیک انقضا',n:s.expiringSoon,kind:'warn'},{label:'درخواست تأیید شده',n:s.approvedRequests,kind:''},{label:'نگرانی دما (۲۴ ساعت)',n:s.temperatureConcerns,kind:'danger'},{label:'امحای ثبت‌شده',n:s.discarded,kind:''}];}
 export(){const s=this.stats();if(s)downloadCsv('hemo-bank-summary.csv',[['شاخص','تعداد'],...this.metrics(s).map(x=>[x.label,x.n])]);}
 print(){window.print();}
}
