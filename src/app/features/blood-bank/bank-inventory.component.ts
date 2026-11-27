import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { BankPageAccess } from './bank-page-access';
import { RequestPageAccess } from '../blood-requests/request-page-access';
import { Subscription } from 'rxjs';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { BloodRequestsService } from '../../core/api/blood-requests.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,fa,message,downloadCsv } from '../../shared/admission-utils';
import { REQUEST_PRODUCTS,productLabel,RequestDetail,RequestRow,RequestPage } from '../blood-requests/blood-request-model';
import { UNIT_STATUS,UnitRow,BankPage,InventoryFilters,statusLabel } from './bank-model';
import { bankDateTime } from './bank-time';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodBankService,BloodRequestsService,BankPageAccess,RequestPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-inventory.component.html'})
export class BankInventoryComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(BankPageAccess);readonly requestAccess=inject(RequestPageAccess);private api=inject(BloodBankService);private requests=inject(BloodRequestsService);private route=inject(ActivatedRoute);
 readonly mode=this.route.snapshot.data['mode']??'inventory';readonly title=this.mode==='lab'?'آزمایش و Crossmatch':this.mode==='thaw'?'ذوب فرآورده‌ها':'مدیریت موجودی بانک خون';
 readonly page=signal<BankPage<UnitRow>|null>(null);readonly selected=signal<RequestDetail|null>(null);readonly queue=signal<RequestPage|null>(null);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly queueBusy=signal(false);readonly queueError=signal<string|null>(null);readonly choosing=signal(false);readonly returning=signal(false);readonly success=signal<string|null>(null);
 readonly products=REQUEST_PRODUCTS;readonly groups=BLOOD_GROUPS;readonly statuses=[...Object.entries(UNIT_STATUS),['ThawQueue','صف ذوب'],['Expired','منقضی'],['ExpiringSoon','نزدیک انقضا (۳ روز)']];
 readonly label=statusLabel;readonly product=productLabel;readonly date=bankDateTime;readonly fa=fa;
 search='';group='';productCode='';status=this.mode==='thaw'?'ThawQueue':this.mode==='lab'?'Available':'';equipment='';allocatedOnly=false;queueSearch='';requestGuid='';returnReason='';
 private filters:InventoryFilters={};private seq=0;private queueSeq=0;private selectionSeq=0;private query?:Subscription;
 canOpen(){return this.auth.bankCan('inventory')&&(this.mode==='inventory'||(this.mode==='lab'?this.auth.bankCan('test')&&this.requestAccess.requestCan('bankQueue')&&this.requestAccess.requestCan('bankDetail'):this.auth.bankCan('thaw')));}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 async ngOnInit(){
   await this.auth.load();if(!this.scope.isCurrent()||!this.auth.bankCan('inventory'))return;
   if(this.mode!=='inventory')await this.requestAccess.load();
   if(!this.scope.isCurrent()||!this.canOpen())return;
   this.query=this.route.queryParamMap.subscribe(q=>{
     ++this.selectionSeq;++this.queueSeq;this.queue.set(null);this.queueBusy.set(false);this.choosing.set(false);this.returning.set(false);this.success.set(null);this.selected.set(null);this.requestGuid='';this.returnReason='';this.allocatedOnly=false;
     this.search=this.group=this.productCode=this.equipment='';this.status=this.mode==='thaw'?'ThawQueue':this.mode==='lab'?'Available':'';
     const status=q.get('status')??'';if(this.mode!=='thaw'&&status&&this.statuses.some(([value])=>value===status))this.status=status;
     const id=q.get('request');if(id&&this.mode!=='inventory'&&this.requestAccess.requestCan('bankDetail'))void this.choose(id);else void this.load();
     if(this.mode==='lab')void this.loadQueue();
   });
 }
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;++this.queueSeq;++this.selectionSeq;this.page.set(null);this.selected.set(null);this.queue.set(null);this.requestGuid=this.returnReason=this.queueSearch=this.search='';}
 async loadQueue(pageNumber=1){
   if(this.mode!=='lab'||!this.canOpen()||this.returning())return;
   const seq=++this.queueSeq;this.queueBusy.set(true);this.queueError.set(null);this.queue.set(null);
   const current=()=>this.scope.isCurrent()&&seq===this.queueSeq;
   try{const p=await this.requests.bank({search:this.queueSearch,pageNumber,pageSize:20});if(current())this.queue.set(p);}
   catch(e){if(current())this.queueError.set(message(e));}finally{if(current())this.queueBusy.set(false);}
 }
 async choose(guid:string){
   if(this.mode==='inventory'||!this.canOpen()||this.returning())return;
   const seq=++this.selectionSeq;++this.seq;this.page.set(null);this.selected.set(null);this.requestGuid=this.returnReason='';this.allocatedOnly=false;
   const current=()=>this.scope.isCurrent()&&seq===this.selectionSeq;
   if(!guid){this.choosing.set(false);this.status=this.mode==='thaw'?'ThawQueue':'Available';this.productCode='';void this.load();return;}
   if(!this.requestAccess.requestCan('bankDetail')){this.busy.set(false);this.choosing.set(false);return;}
   this.busy.set(true);this.choosing.set(true);this.error.set(null);
   try{const r=await this.requests.get(guid,true);if(!current())return;
     if(r.request.guid.toLowerCase()!==guid.toLowerCase()||r.request.status!=='AwaitingBank')throw new Error('شناسه درخواست مطابقت ندارد.');
     this.selected.set(r);this.requestGuid=r.request.guid;this.status=this.mode==='thaw'?'ThawQueue':'Available';
     this.productCode=r.items.length===1?r.items[0].productCode:'';this.allocatedOnly=this.mode==='thaw';this.choosing.set(false);await this.load();
   }catch(e){if(current())this.error.set(message(e));}finally{if(current()){this.busy.set(false);this.choosing.set(false);}}
 }
 async load(pageNumber=1){
   if(!this.canOpen()||this.choosing()||this.returning())return;
   const seq=++this.seq;this.busy.set(true);this.error.set(null);this.page.set(null);
   if(pageNumber===1)this.filters={search:this.search,product:this.productCode,group:this.group,status:this.mode==='thaw'?'ThawQueue':this.status,equipment:this.equipment,...(this.allocatedOnly&&this.requestGuid?{requestGuid:this.requestGuid}:{})};
   try{const p=await this.api.inventory({...this.filters,pageNumber,pageSize:20});if(this.current(seq))this.page.set(p);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 toggleAllocated(){if(!this.canOpen()||this.choosing()||this.returning())return;this.status=this.mode==='thaw'?'ThawQueue':'';void this.load();}
 reset(){if(!this.canOpen()||this.choosing()||this.returning())return;this.search=this.group=this.productCode=this.equipment='';this.status=this.mode==='thaw'?'ThawQueue':this.mode==='lab'?'Available':'';void this.load();}
 async returnRequest(){
   const r=this.selected();if(this.mode!=='lab'||!this.canOpen()||!r||r.request.status!=='AwaitingBank'||this.choosing()||this.returning()||!this.auth.bankCan('returnRequest')||!this.requestAccess.requestCan('bankDetail')||!this.returnReason.trim()||this.busy())return;
   if(!window.confirm('درخواست برای بازبینی به ثبت‌کننده برگردد؟'))return;
   const seq=++this.selectionSeq;this.returning.set(true);this.error.set(null);this.success.set(null);
   try{await this.api.returnRequest({requestGuid:r.request.guid,version:r.version,reason:this.returnReason});
     if(!this.scope.isCurrent()||seq!==this.selectionSeq)return;
     this.selected.set(null);this.requestGuid=this.returnReason='';this.allocatedOnly=false;this.productCode='';this.status='Available';this.success.set('درخواست برای اصلاح برگشت داده شد.');this.returning.set(false);await Promise.all([this.load(),this.loadQueue()]);
   }catch(e){if(this.scope.isCurrent()&&seq===this.selectionSeq)this.error.set(message(e));}finally{if(this.scope.isCurrent()&&seq===this.selectionSeq)this.returning.set(false);}
 }
 exportPage(){const p=this.page();if(p&&this.canOpen()&&!this.busy()&&!this.returning()&&!this.choosing())downloadCsv('hemo-bank-inventory.csv',[['کد واحد','فرآورده','گروه','تجهیز','انقضا','وضعیت'],...p.data.map(x=>[x.unitCode,productLabel(x.productCode),x.bloodGroup,x.equipmentCode,bankDateTime(x.expiresAt),statusLabel(x)])]);}
 print(){if(this.canOpen()&&this.page()&&!this.busy()&&!this.returning()&&!this.choosing())window.print();}
}
