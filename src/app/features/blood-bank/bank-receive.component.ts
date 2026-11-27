import { Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { BankPageAccess } from './bank-page-access';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,message } from '../../shared/admission-utils';
import { REQUEST_PRODUCTS } from '../blood-requests/blood-request-model';
import { localFields,toUtc } from './bank-time';
@Component({standalone:true,providers:[HemoPageScope,HemoCompanyHttp,BloodBankService,BankPageAccess],imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-receive.component.html'})
export class BankReceiveComponent implements OnInit,OnDestroy{
 readonly scope=inject(HemoPageScope);readonly auth=inject(BankPageAccess);private api=inject(BloodBankService);private router=inject(Router);
 readonly savedGuid=signal<string|null>(null);readonly busy=signal(false);readonly error=signal<string|null>(null);readonly groups=BLOOD_GROUPS;readonly products=REQUEST_PRODUCTS;
 form={unitCode:'',productCode:'',bloodGroup:'',batchNumber:'',supplySource:'',equipmentCode:'',notes:''};received=localFields();expiry={date:'',time:''};
 async ngOnInit(){await this.auth.load();}
 ngOnDestroy(){this.scope.invalidate();this.savedGuid.set(null);this.form={unitCode:'',productCode:'',bloodGroup:'',batchNumber:'',supplySource:'',equipmentCode:'',notes:''};this.expiry={date:'',time:''};}
 canReceive(){return this.auth.bankCan('receive')&&this.auth.bankCan('unit');}
 async save(){
   if(this.busy()||this.savedGuid()||!this.canReceive())return;
   this.error.set(null);this.busy.set(true);
   try{
     const x=this.form;
     if(!x.unitCode.trim()||!this.products.some(p=>p.code===x.productCode)||!this.groups.some(g=>g===x.bloodGroup)||!x.supplySource.trim()||!x.equipmentCode.trim())throw new Error('اطلاعات الزامی دریافت را تکمیل کنید.');
     const receivedAt=toUtc(this.received.date,this.received.time),expiresAt=toUtc(this.expiry.date,this.expiry.time);
     if(Date.parse(expiresAt)<=Date.parse(receivedAt))throw new Error('انقضا باید بعد از دریافت باشد.');
     const id=await this.api.receive({...x,batchNumber:x.batchNumber||null,notes:x.notes||null,receivedAt,expiresAt});
     if(!this.scope.isCurrent())return;
     this.savedGuid.set(id);await this.router.navigate(['/hemo/bank/unit',id]);
   }catch(e){if(this.scope.isCurrent())this.error.set(message(e));}
   finally{if(this.scope.isCurrent())this.busy.set(false);}
 }
}
