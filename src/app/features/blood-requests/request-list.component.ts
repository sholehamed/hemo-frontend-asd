import { Component,OnInit,inject,signal,computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { downloadCsv,fa,message } from '../../shared/admission-utils';
import { isoToJalali,normalizeDigits } from '../../shared/jalali-date';
import { RequestPage,RequestStats,RequestFilters,REQUEST_STATUS_LABEL,PRIORITIES,formLabel } from './blood-request-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./request-list.component.html'})
export class RequestListComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'list';readonly bank=this.mode==='bank';readonly approval=this.mode==='approval';
 readonly title=this.bank?'صف درخواست‌های تأییدشده بانک خون':this.approval?'کارتابل تأیید پزشک':'مدیریت درخواست‌های خون و فرآورده‌ها';
 readonly allowed=computed(()=>this.bank?this.auth.requestCan('bankQueue'):this.auth.requestCan('list')&&(!this.approval||this.auth.requestCan('decide')));
 readonly page=signal<RequestPage|null>(null);readonly stats=signal<RequestStats|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly statusLabels=REQUEST_STATUS_LABEL;readonly priorities=PRIORITIES;readonly formLabel=formLabel;readonly date=isoToJalali;readonly fa=fa;
 readonly statuses=Object.entries(REQUEST_STATUS_LABEL);readonly priorityList=Object.entries(PRIORITIES);
 search='';status='';priority='';ward='';mine=false;readonly patientFilter=this.route.snapshot.queryParamMap.get('admission');private applied:RequestFilters={};private seq=0;
 ngOnInit(){if(this.allowed())void this.load(1);}
 async load(pageNumber=1){
  if(!this.allowed())return;
  if(pageNumber===1)this.applied={search:normalizeDigits(this.search.trim()),status:this.approval?'AwaitingDoctor':this.status,priority:this.priority,ward:this.ward,mine:this.mine,...(!this.bank&&this.patientFilter?{patientAdmissionGuid:this.patientFilter}:{})};
  const seq=++this.seq;this.busy.set(true);this.error.set(null);
  try{const filters={...this.applied,pageNumber,pageSize:20};const [page,stats]=await Promise.all([this.bank?this.api.bank(filters):this.api.list(filters),!this.bank&&this.auth.requestCan('stats')?this.api.stats(this.mine):Promise.resolve(null)]);if(seq===this.seq){this.page.set(page);this.stats.set(stats);}}
  catch(e){if(seq===this.seq){this.page.set(null);this.error.set(message(e));}}finally{if(seq===this.seq)this.busy.set(false);}
 }
 reset(){this.search=this.status=this.priority=this.ward='';this.mine=false;void this.load();}
 exportPage(){const p=this.page();if(!p)return;downloadCsv('hemo-blood-requests-page.csv',[['درخواست','بیمار','پرونده','بخش','فرم','اولویت','وضعیت','تعداد','تاریخ'],...p.data.map(r=>[r.requestNumber,r.patientName,r.hisNumber,r.ward,formLabel(r.formType),PRIORITIES[r.priority],REQUEST_STATUS_LABEL[r.status],r.totalUnits,isoToJalali(r.created)])]);}
 print(){window.print();}
}
