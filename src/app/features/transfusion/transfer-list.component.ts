import { Component,OnInit,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,downloadCsv } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { BankPage } from '../blood-bank/bank-model';
import { bankDateTime,toUtc } from '../blood-bank/bank-time';
import { TransferRow,TransferFilters,STATUSES,statusClass } from './transfer-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-list.component.html'})
export class TransferListComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(TransfusionService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'tasks';
 readonly title=({tasks:'کارتابل تحویل و تزریق',vitals:'پایش علائم حیاتی',monitoring:'کارتابل پایش پزشک',returns:'مدیریت مرجوعی فرآورده',records:'پرونده و گزارش تزریق'} as Record<string,string>)[this.mode]??'حواله‌ها';
 readonly page=signal<BankPage<TransferRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statuses=STATUSES;readonly options=[['Active','در گردش'],['ReturnQueue','صف مرجوعی و توقف'],...Object.entries(STATUSES)];readonly color=statusClass;readonly fa=fa;readonly date=bankDateTime;readonly product=productLabel;
 search='';ward='';status=this.mode==='returns'?'ReturnQueue':this.mode==='vitals'||this.mode==='monitoring'?'Active':'';fromDate='';toDate='';
 admissionGuid=this.route.snapshot.queryParamMap.get('admission')??'';requestGuid=this.route.snapshot.queryParamMap.get('request')??'';private filters:TransferFilters={};private seq=0;
 ngOnInit(){const status=this.route.snapshot.queryParamMap.get('status')??'';if(this.options.some(([value])=>value===status))this.status=status;if(this.auth.transferCan('list'))void this.load();}
 async load(pageNumber=1){if(!this.auth.transferCan('list'))return;const seq=++this.seq;this.busy.set(true);this.error.set(null);try{
 if(pageNumber===1)this.filters={search:this.search,ward:this.ward,status:this.status,admissionGuid:this.admissionGuid||undefined,requestGuid:this.requestGuid||undefined,...(this.fromDate?{from:toUtc(this.fromDate,'00:00')}:{}),...(this.toDate?{to:new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString()}: {})};
 const data=await this.api.list({...this.filters,pageNumber,pageSize:20});if(seq===this.seq)this.page.set(data);
 }catch(e){if(seq===this.seq){this.page.set(null);this.error.set(message(e));}}finally{if(seq===this.seq)this.busy.set(false);}}
 reset(){this.search=this.ward=this.status=this.fromDate=this.toDate=this.admissionGuid=this.requestGuid='';void this.load();}
 export(){const p=this.page();if(p)downloadCsv('hemo-transfusion.csv',[['حواله','بیمار','پرونده','بخش','واحد','فرآورده','وضعیت','زمان ارسال'],...p.data.map(t=>[t.transferNumber,t.patientName,t.hisNumber,t.ward,t.unitCode,productLabel(t.productCode),STATUSES[t.status],bankDateTime(t.dispatchedAt)])]);}
 print(){window.print();}
}
