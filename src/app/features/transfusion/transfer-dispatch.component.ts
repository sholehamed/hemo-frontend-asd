import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { TransferPageAccess } from './transfer-page-access';
import { Subscription } from 'rxjs';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,maskFor } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { BankPage } from '../blood-bank/bank-model';
import { bankDateTime } from '../blood-bank/bank-time';
import { Candidate,CHECKS,codeMatches } from './transfer-model';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,TransfusionService,TransferPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-dispatch.component.html'})
export class TransferDispatchComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(TransferPageAccess);private api=inject(TransfusionService);private router=inject(Router);private route=inject(ActivatedRoute);
 readonly page=signal<BankPage<Candidate>|null>(null);readonly selected=signal<Candidate|null>(null);readonly busy=signal(false);readonly saving=signal(false);readonly savedGuid=signal<string|null>(null);readonly error=signal<string|null>(null);
 readonly checks=CHECKS;readonly date=bankDateTime;readonly product=productLabel;readonly fa=fa;
 search='';requestGuid=this.route.snapshot.queryParamMap.get('request')??'';private applied='';
 flags=[false,false,false,false,false];
 form={unitCode:'',wristbandCode:'',carrierName:'',carrierCode:'',containerCode:'',temperature:null as number|null,transportIndicator:'',packCount:null as number|null,notes:''};
 private seq=0;private query?:Subscription;
 canOpen(){return this.auth.transferCan('candidates')&&this.auth.transferCan('dispatch')&&this.auth.transferCan('detail');}
 private current(seq:number){return this.scope.isCurrent()&&seq===this.seq;}
 private clearSelection(){this.selected.set(null);this.flags=this.checks.map(()=>false);this.form={unitCode:'',wristbandCode:'',carrierName:'',carrierCode:'',containerCode:'',temperature:null,transportIndicator:'',packCount:null,notes:''};}
 async ngOnInit(){await this.auth.load();if(!this.canOpen())return;this.query=this.route.queryParamMap.subscribe(q=>{if(this.saving()||this.savedGuid())return;this.requestGuid=q.get('request')??'';this.search='';void this.load();});}
 ngOnDestroy(){this.query?.unsubscribe();this.scope.invalidate();++this.seq;this.page.set(null);this.savedGuid.set(null);this.clearSelection();this.search=this.requestGuid='';}
 async load(pageNumber=1){
   if(!this.canOpen()||this.saving()||this.savedGuid())return;
   const seq=++this.seq;this.clearSelection();this.page.set(null);this.busy.set(true);this.error.set(null);
   if(pageNumber===1)this.applied=this.search;
   try{const p=await this.api.candidates({search:this.applied,requestGuid:this.requestGuid||undefined,pageNumber,pageSize:20});if(this.current(seq))this.page.set(p);}
   catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.busy.set(false);}
 }
 clearRequest(){if(!this.canOpen()||this.saving()||this.savedGuid())return;void this.router.navigate([], {relativeTo:this.route,queryParams:{request:null},queryParamsHandling:'merge'});}
 choose(u:Candidate){
   if(!this.canOpen()||this.busy()||this.saving()||this.savedGuid())return;
   const candidate=this.page()?.data.find(x=>x.unitGuid===u.unitGuid&&x.unitVersion===u.unitVersion);
   if(!candidate)return;this.clearSelection();this.selected.set(candidate);this.error.set(null);
 }
 cancel(){if(!this.saving())this.clearSelection();}
 async save(){
   const u=this.selected(),v=this.form;if(!u||!this.canOpen()||this.busy()||this.saving()||this.savedGuid())return;
   const seq=this.seq;this.error.set(null);
   try{
     if(!codeMatches(v.unitCode,v.wristbandCode,u.unitCode,u.wristbandCode)||maskFor(this.flags)!==31)throw new Error('شناسه‌های مشاهده‌شده و همه بررسی‌های مستند باید منطبق باشند.');
     if(!v.carrierName.trim()||!v.carrierCode.trim()||!v.containerCode.trim()||v.temperature===null||!Number.isFinite(v.temperature)||!v.transportIndicator.trim()||!v.notes.trim())throw new Error('اطلاعات حمل و شرح اقدام الزامی است.');
     if(!window.confirm('صدور این واحد و انتقال به وضعیت ارسال‌شده ثبت شود؟'))return;
     this.saving.set(true);
     const id=await this.api.dispatch({...v,temperature:v.temperature,unitGuid:u.unitGuid,unitVersion:u.unitVersion,checks:maskFor(this.flags)});
     if(!this.current(seq))return;
     this.savedGuid.set(id);this.clearSelection();this.page.set(null);
     await this.router.navigate(['/hemo/transfusion/detail',id]);
   }catch(e){if(this.current(seq))this.error.set(message(e));}finally{if(this.current(seq))this.saving.set(false);}
 }
}
