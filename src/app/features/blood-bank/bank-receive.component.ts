import { Component,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router,RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { BloodBankService } from '../../core/api/blood-bank.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
import { BLOOD_GROUPS,message } from '../../shared/admission-utils';
import { REQUEST_PRODUCTS } from '../blood-requests/blood-request-model';
import { localFields,toUtc } from './bank-time';
@Component({standalone:true,imports:[FormsModule,RouterLink,MatButtonModule,RequestStateComponent],templateUrl:'./bank-receive.component.html'})
export class BankReceiveComponent{
 readonly auth=inject(AuthService);private api=inject(BloodBankService);private router=inject(Router);
 readonly busy=signal(false);readonly error=signal<string|null>(null);readonly groups=BLOOD_GROUPS;readonly products=REQUEST_PRODUCTS;
 form={unitCode:'',productCode:'',bloodGroup:'',batchNumber:'',supplySource:'',equipmentCode:'',notes:''};received=localFields();expiry={date:'',time:''};
 async save(){if(this.busy()||!this.auth.bankCan('receive'))return;this.error.set(null);this.busy.set(true);try{const x=this.form;if(!x.unitCode.trim()||!x.productCode||!x.bloodGroup||!x.supplySource.trim()||!x.equipmentCode.trim())throw new Error('اطلاعات الزامی دریافت را تکمیل کنید.');const receivedAt=toUtc(this.received.date,this.received.time),expiresAt=toUtc(this.expiry.date,this.expiry.time);if(Date.parse(expiresAt)<=Date.parse(receivedAt))throw new Error('انقضا باید بعد از دریافت باشد.');const id=await this.api.receive({...x,batchNumber:x.batchNumber||null,notes:x.notes||null,receivedAt,expiresAt});await this.router.navigate(['/hemo/bank/unit',id]);}catch(e){this.error.set(message(e));}finally{this.busy.set(false);}}
}
