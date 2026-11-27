import { Component,OnInit,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,fa,message,downloadCsv } from '../../shared/admission-utils';
import { REQUEST_PRODUCTS,productLabel,RequestDetail,RequestRow,RequestPage } from '../blood-requests/blood-request-model';
import { UNIT_STATUS,UnitRow,BankPage,InventoryFilters,statusLabel } from './bank-model';
import { bankDateTime } from './bank-time';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-inventory.component.html'})
export class BankInventoryComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(BloodBankService);private requests=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'inventory';readonly title=this.mode==='lab'?'آزمایش و Crossmatch':this.mode==='thaw'?'ذوب فرآورده‌ها':'مدیریت موجودی بانک خون';
 readonly page=signal<BankPage<UnitRow>|null>(null);readonly selected=signal<RequestDetail|null>(null);readonly queue=signal<RequestPage|null>(null);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly queueBusy=signal(false);readonly queueError=signal<string|null>(null);
 readonly products=REQUEST_PRODUCTS;readonly groups=BLOOD_GROUPS;readonly statuses=[...Object.entries(UNIT_STATUS),['ThawQueue','صف ذوب'],['Expired','منقضی'],['ExpiringSoon','نزدیک انقضا (۳ روز)']];
 readonly label=statusLabel;readonly product=productLabel;readonly date=bankDateTime;readonly fa=fa;
 search='';group='';productCode='';status=this.mode==='thaw'?'ThawQueue':this.mode==='lab'?'Available':'';equipment='';allocatedOnly=false;queueSearch='';requestGuid='';returnReason='';
 private filters:InventoryFilters={};private seq=0;
 ngOnInit(){if(!this.auth.bankCan('inventory'))return;const q=this.route.snapshot.queryParamMap;const status=q.get('status')??'';if(this.statuses.some(([value])=>value===status))this.status=status;const id=q.get('request');if(id)void this.choose(id);else void this.load();if(this.mode==='lab')void this.loadQueue();}
 async loadQueue(pageNumber=1){if(!this.auth.requestCan('bankQueue'))return;this.queueBusy.set(true);this.queueError.set(null);try{this.queue.set(await this.requests.bank({search:this.queueSearch,pageNumber,pageSize:20}));}catch(e){this.queueError.set(message(e));}finally{this.queueBusy.set(false);}}
 async choose(guid:string){if(!guid){this.selected.set(null);this.requestGuid='';this.allocatedOnly=false;void this.load();return;}if(!this.auth.requestCan('bankDetail'))return;this.busy.set(true);this.error.set(null);try{const r=await this.requests.get(guid,true);this.selected.set(r);this.requestGuid=r.request.guid;this.status=this.mode==='thaw'?'ThawQueue':'Available';this.allocatedOnly=false;if(r.items.length===1)this.productCode=r.items[0].productCode;else this.productCode='';await this.load();}catch(e){this.error.set(message(e));this.selected.set(null);this.requestGuid='';}finally{this.busy.set(false);}}
 async load(pageNumber=1){if(!this.auth.bankCan('inventory'))return;const seq=++this.seq;this.busy.set(true);this.error.set(null);if(pageNumber===1)this.filters={search:this.search,product:this.productCode,group:this.group,status:this.status,equipment:this.equipment,...(this.allocatedOnly&&this.requestGuid?{requestGuid:this.requestGuid}:{})};try{const p=await this.api.inventory({...this.filters,pageNumber,pageSize:20});if(seq===this.seq)this.page.set(p);}catch(e){if(seq===this.seq){this.page.set(null);this.error.set(message(e));}}finally{if(seq===this.seq)this.busy.set(false);}}
 toggleAllocated(){this.status='';void this.load();}
 reset(){this.search=this.group=this.productCode=this.equipment=this.status='';void this.load();}
 async returnRequest(){const r=this.selected();if(!r||!this.auth.bankCan('returnRequest')||!this.returnReason.trim()||this.busy())return;if(!window.confirm('درخواست برای بازبینی به ثبت‌کننده برگردد؟'))return;this.busy.set(true);try{await this.api.returnRequest({requestGuid:r.request.guid,version:r.version,reason:this.returnReason});this.selected.set(null);this.requestGuid='';this.returnReason='';this.allocatedOnly=false;await this.load();await this.loadQueue();}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
 exportPage(){const p=this.page();if(p)downloadCsv('hemo-bank-inventory.csv',[['کد واحد','فرآورده','گروه','تجهیز','انقضا','وضعیت'],...p.data.map(x=>[x.unitCode,productLabel(x.productCode),x.bloodGroup,x.equipmentCode,bankDateTime(x.expiresAt),statusLabel(x)])]);}
 print(){window.print();}
}
