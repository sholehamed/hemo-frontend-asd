import {Injectable,inject,signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HemoPageScope} from '../../core/hemo/hemo-page-scope';
import {HemoCompanyHttp} from '../../core/api/hemo-company-http';
import type {AdmissionCapabilities} from '../../core/auth/auth.service';
import type {RequestCapabilities} from '../blood-requests/blood-request-model';
import type {BankCapabilities} from '../blood-bank/bank-model';
import type {TransferCapabilities,CapabilityKey} from '../transfusion/transfer-model';
import type {HvCapabilities,HvCapability} from '../hemovigilance/hv-model';
import type {QualityCapabilities} from '../quality/quality-model';
interface Caps {admission:AdmissionCapabilities|null;requests:RequestCapabilities|null;bank:BankCapabilities|null;transfer:TransferCapabilities|null;hv:HvCapabilities|null;quality:QualityCapabilities|null}
const empty=():Caps=>({admission:null,requests:null,bank:null,transfer:null,hv:null,quality:null});
@Injectable()
export class DashboardPageAccess{
 private scope=inject(HemoPageScope);private http=inject(HemoCompanyHttp);
 private caps=signal<Caps>(empty());readonly errors=signal<string[]>([]);
 private generation=0;
 private read(){return this.scope.isCurrent()?this.caps():empty();}
 can(k:keyof AdmissionCapabilities){return this.read().admission?.[k]===true;}
 requestCan(k:keyof RequestCapabilities){return this.read().requests?.[k]===true;}
 bankCan(k:keyof BankCapabilities){return this.read().bank?.[k]===true;}
 transferCan(k:CapabilityKey){return this.read().transfer?.[k]===true;}
 hvCan(k:HvCapability){return this.read().hv?.[k]===true;}
 qualityCan(k:string){return this.read().quality?.permissions?.[k]===true;}
 async load(){
  if(!this.scope.isCurrent())return;const generation=++this.generation;this.caps.set(empty());this.errors.set([]);
  const current=()=>this.scope.isCurrent()&&generation===this.generation;
  const get=async<T>(module:string,label:string):Promise<T|null>=>{try{const v=await firstValueFrom(this.http.get<T>('/Identity/'+module+'/Capabilities'));if(v==null)throw new Error('Missing capabilities');return v;}catch{if(current())this.errors.update(x=>[...x,label]);return null;}};
  const [admission,requests,bank,transfer,hv,quality]=await Promise.all([
   get<AdmissionCapabilities>('PatientAdmission','پذیرش'),get<RequestCapabilities>('BloodRequest','درخواست خون'),
   get<BankCapabilities>('BloodBank','بانک خون'),get<TransferCapabilities>('Transfusion','تزریق'),
   get<HvCapabilities>('Hemovigilance','هموویژیلانس'),get<QualityCapabilities>('HemoQuality','کیفیت و تجهیزات')
  ]);
  if(current())this.caps.set({admission,requests,bank,transfer,hv,quality});
 }
}
