import {Component,OnInit,inject,signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute,RouterLink} from '@angular/router';
import {MatButtonModule} from '@angular/material/button';
import {AuthService} from '../../core/auth/auth.service';
import {HemovigilanceService} from '../../core/api/hemovigilance.service';
import {RequestStateComponent} from '../../shared/components/request-state.component';
import {fa,message,downloadCsv} from '../../shared/admission-utils';
import {BankPage} from '../blood-bank/bank-model';
import {bankDateTime,toUtc} from '../blood-bank/bank-time';
import {productLabel} from '../blood-requests/blood-request-model';
import {CaseRow,Filters,STATUS,DIAGNOSES,SEVERITIES,statusColor} from './hv-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./hv-list.component.html'})
export class HvListComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(HemovigilanceService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'cases';readonly title=({cases:'پرونده واکنش‌های نامطلوب',doctor:'کارتابل بررسی پزشک',bank:'کارتابل بررسی بانک خون',rca:'کارتابل تحلیل ریشه‌ای RCA',capa:'کارتابل پیگیری CAPA'} as Record<string,string>)[this.mode];
 readonly page=signal<BankPage<CaseRow>|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statuses=STATUS;readonly statusOptions=[['Open','پرونده‌های باز'],...Object.entries(STATUS)];readonly diagnosis=DIAGNOSES;readonly severity=SEVERITIES;readonly severityOptions=Object.entries(SEVERITIES);readonly date=bankDateTime;readonly fa=fa;readonly product=productLabel;readonly color=statusColor;
 search='';ward='';productCode='';severityFilter='';fromDate='';toDate='';status=({doctor:'Reported',bank:'DoctorReviewed',rca:'BankReviewed',capa:'CapaMonitoring'} as Record<string,string>)[this.mode]??'';
 transferGuid=this.route.snapshot.queryParamMap.get('transfer')??'';private filters:Filters={};private seq=0;
 ngOnInit(){if(this.auth.hvCan('list'))void this.load();}
 async load(pageNumber=1){if(!this.auth.hvCan('list'))return;const seq=++this.seq;this.busy.set(true);this.error.set(null);try{
 if(pageNumber===1)this.filters={search:this.search,status:this.status,ward:this.ward,productCode:this.productCode,severity:this.severityFilter,transferGuid:this.transferGuid||undefined,...(this.fromDate?{from:toUtc(this.fromDate,'00:00')}:{}),...(this.toDate?{to:new Date(Date.parse(toUtc(this.toDate,'23:59'))+59999).toISOString()}: {})};
 const p=await this.api.list({...this.filters,pageNumber,pageSize:20});if(seq===this.seq)this.page.set(p);
 }catch(e){if(seq===this.seq){this.page.set(null);this.error.set(message(e));}}finally{if(seq===this.seq)this.busy.set(false);}}
 reset(){this.search=this.ward=this.productCode=this.severityFilter=this.fromDate=this.toDate=this.status=this.transferGuid='';void this.load();}
 export(){const p=this.page();if(p)downloadCsv('hemo-hv-cases.csv',[['پرونده واکنش','بیمار','پرونده بیمار','بخش','فرآورده','کیسه','بروز','تشخیص ثبت‌شده','شدت ثبت‌شده','وضعیت'],...p.data.map(r=>[r.caseNumber,r.patientName,r.hisNumber,r.ward,productLabel(r.productCode),r.unitCode,bankDateTime(r.onsetAt),DIAGNOSES[r.diagnosisCode??'Undetermined'],SEVERITIES[r.severity??r.initialSeverity],STATUS[r.status]])]);}
 print(){window.print();}
}
