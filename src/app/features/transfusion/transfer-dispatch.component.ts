import { Component,OnInit,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { TransfusionService } from '../../core/api/transfusion.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { fa,message,maskFor } from '../../shared/admission-utils';
import { productLabel } from '../blood-requests/blood-request-model';
import { BankPage } from '../blood-bank/bank-model';
import { bankDateTime } from '../blood-bank/bank-time';
import { Candidate,CHECKS,codeMatches } from './transfer-model';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./transfer-dispatch.component.html'})
export class TransferDispatchComponent implements OnInit{
 readonly auth=inject(AuthService);private api=inject(TransfusionService);private router=inject(Router);private route=inject(ActivatedRoute);
 readonly page=signal<BankPage<Candidate>|null>(null);readonly selected=signal<Candidate|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);
 readonly checks=CHECKS;readonly date=bankDateTime;readonly product=productLabel;readonly fa=fa;
 search='';requestGuid=this.route.snapshot.queryParamMap.get('request')??'';private applied='';
 flags=[false,false,false,false,false];
 form={unitCode:'',wristbandCode:'',carrierName:'',carrierCode:'',containerCode:'',temperature:null as number|null,transportIndicator:'',packCount:null as number|null,notes:''};
 ngOnInit(){if(this.auth.transferCan('candidates'))void this.load();}
 async load(pageNumber=1){if(!this.auth.transferCan('candidates'))return;this.busy.set(true);this.error.set(null);if(pageNumber===1)this.applied=this.search;try{this.page.set(await this.api.candidates({search:this.applied,requestGuid:this.requestGuid||undefined,pageNumber,pageSize:20}));}catch(e){this.page.set(null);this.error.set(message(e));}finally{this.busy.set(false);}}
 choose(u:Candidate){this.selected.set(u);this.flags=this.checks.map(()=>false);this.form={unitCode:'',wristbandCode:'',carrierName:'',carrierCode:'',containerCode:'',temperature:null,transportIndicator:'',packCount:null,notes:''};this.error.set(null);}
 async save(){const u=this.selected(),v=this.form;if(!u||this.busy()||!this.auth.transferCan('dispatch'))return;this.error.set(null);try{
  if(!codeMatches(v.unitCode,v.wristbandCode,u.unitCode,u.wristbandCode)||maskFor(this.flags)!==31)throw new Error('شناسه‌های مشاهده‌شده و همه بررسی‌های مستند باید منطبق باشند.');
  if(!v.carrierName.trim()||!v.carrierCode.trim()||!v.containerCode.trim()||v.temperature===null||!Number.isFinite(v.temperature)||!v.transportIndicator.trim()||!v.notes.trim())throw new Error('اطلاعات حمل و شرح اقدام الزامی است.');
  if(!window.confirm('صدور این واحد و انتقال به وضعیت ارسال‌شده ثبت شود؟'))return;this.busy.set(true);
  const id=await this.api.dispatch({...v,temperature:v.temperature,unitGuid:u.unitGuid,unitVersion:u.unitVersion,checks:maskFor(this.flags)});await this.router.navigate(['/hemo/transfusion/detail',id]);
 }catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
