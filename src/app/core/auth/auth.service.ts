import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { QualityCapabilities } from '../../features/quality/quality-model';
import { HvCapabilities,HvCapability } from '../../features/hemovigilance/hv-model';
import { TransferCapabilities,CapabilityKey } from '../../features/transfusion/transfer-model';
import { BankCapabilities } from '../../features/blood-bank/bank-model';
import { RequestCapabilities } from '../../features/blood-requests/blood-request-model';
export interface Token { key:string;firstName:string;lastName:string;expireDate:string;forceChangePassword:boolean;multiLogin:boolean;userRole:number }
export interface CurrentRole { name:string;gkey:number;orgLocationName:string;organizationName:string }
export interface LoginRequest {username:string;password:string;userEnteredCaptchaCode:string;captchaId:string;otpCode:string|null}
export interface AdmissionCapabilities {stats:boolean;list:boolean;detail:boolean;find:boolean;history:boolean;reviews:boolean;create:boolean;update:boolean;review:boolean;identity:boolean}
const KEY='hemo-asd-session';
function read():Token|null { try { const x=JSON.parse(sessionStorage.getItem(KEY)??'null') as Token|null;return x&&x.key&&Date.parse(x.expireDate)>Date.now()?x:null; }catch{return null;} }
@Injectable({providedIn:'root'})
export class AuthService {
  private http=inject(HttpClient);
  readonly session=signal<Token|null>(read());
  readonly roles=signal<CurrentRole[]>([]);
  readonly loggedIn=computed(()=>!!this.session()&&!this.session()?.forceChangePassword);
  readonly allowed=signal(false);
  readonly capabilities=signal<AdmissionCapabilities|null>(null);
  readonly requestCapabilities=signal<RequestCapabilities|null>(null);
  readonly bankCapabilities=signal<BankCapabilities|null>(null);
  readonly transferCapabilities=signal<TransferCapabilities|null>(null);
  readonly hvCapabilities=signal<HvCapabilities|null>(null);
  readonly qualityCapabilities=signal<QualityCapabilities|null>(null);
  qualityCan(key:string){return this.qualityCapabilities()?.permissions?.[key]===true;}
  hvCan(key:HvCapability){return this.hvCapabilities()?.[key]===true;}
  transferCan(key:CapabilityKey){return this.transferCapabilities()?.[key]===true;}
  bankCan(key:keyof BankCapabilities){return this.bankCapabilities()?.[key]===true;}
  requestCan(key:keyof RequestCapabilities){return this.requestCapabilities()?.[key]===true;}
  homePath(){return '/home';}
  can(key:keyof AdmissionCapabilities){return this.capabilities()?.[key]===true;}
  readonly checking=signal(false);
  async login(req:LoginRequest):Promise<'otp'|'password'|'ok'>{
    const token=await firstValueFrom(this.http.post<Token>('/Identity/HemoSession/Login',req));
    if(token.key==='otp')return 'otp';
    if(!token.key)throw new Error('پاسخ ورود معتبر نیست.');
    if(token.forceChangePassword)return 'password';
    this.setSession(token);await this.refreshContext();return 'ok';
  }
  private setSession(token:Token){this.session.set(token);sessionStorage.setItem(KEY,JSON.stringify(token));}
  async refreshContext(){
    if(!this.loggedIn())return;
    this.checking.set(true);this.allowed.set(false);this.capabilities.set(null);this.requestCapabilities.set(null);this.bankCapabilities.set(null);this.transferCapabilities.set(null);this.hvCapabilities.set(null);this.qualityCapabilities.set(null);
    try{
      const roles=await firstValueFrom(this.http.get<CurrentRole[]>('/Identity/UserRole/GetCurrentUserRoles'));
      this.roles.set(roles??[]);
      const current=this.session();
      if(!current||!roles.length)return;
      if(!roles.some(r=>r.gkey===current.userRole))this.setSession({...current,userRole:roles[0].gkey});
      // Ask the real, scoped endpoint rather than trusting a client-side role label.
      const [admission,requests,bank,transfer,hv,quality]=await Promise.allSettled([firstValueFrom(this.http.get<AdmissionCapabilities>('/Identity/PatientAdmission/Capabilities')),firstValueFrom(this.http.get<RequestCapabilities>('/Identity/BloodRequest/Capabilities')),firstValueFrom(this.http.get<BankCapabilities>('/Identity/BloodBank/Capabilities')),firstValueFrom(this.http.get<TransferCapabilities>('/Identity/Transfusion/Capabilities')),firstValueFrom(this.http.get<HvCapabilities>('/Identity/Hemovigilance/Capabilities')),firstValueFrom(this.http.get<QualityCapabilities>('/Identity/HemoQuality/Capabilities'))]);
      if(!this.session())return;
      const caps=admission.status==='fulfilled'?admission.value:null;
      const req=requests.status==='fulfilled'?requests.value:null;
      const bankCaps=bank.status==='fulfilled'?bank.value:null;
      const txCaps=transfer.status==='fulfilled'?transfer.value:null;
      this.capabilities.set(caps);this.requestCapabilities.set(req);this.bankCapabilities.set(bankCaps);this.transferCapabilities.set(txCaps);const hvCaps=hv.status==='fulfilled'?hv.value:null;this.hvCapabilities.set(hvCaps);const qualityCaps=quality.status==='fulfilled'?quality.value:null;this.qualityCapabilities.set(qualityCaps);
      this.allowed.set(Object.values(caps??{}).some(Boolean)||Object.values(req??{}).some(Boolean)||Object.values(bankCaps??{}).some(Boolean)||Object.values(txCaps??{}).some(v=>v===true)||Object.values(hvCaps??{}).some(v=>v===true)||Object.values(qualityCaps?.permissions??{}).some(v=>v===true));
    }catch{this.allowed.set(false);}
    finally{this.checking.set(false);}
  }
  selectRole(role:number){const current=this.session();if(!current||!this.roles().some(r=>r.gkey===role))return;this.setSession({...current,userRole:role});this.allowed.set(false);location.assign('/home');}
  async logout(){
    try{if(this.session())await firstValueFrom(this.http.get('/Identity/User/UserLogout'));}catch{/* clear local session regardless */}
    this.clear();
  }
  clear(){this.session.set(null);this.roles.set([]);this.capabilities.set(null);this.requestCapabilities.set(null);this.bankCapabilities.set(null);this.transferCapabilities.set(null);this.hvCapabilities.set(null);this.qualityCapabilities.set(null);this.allowed.set(false);sessionStorage.removeItem(KEY);}
}
