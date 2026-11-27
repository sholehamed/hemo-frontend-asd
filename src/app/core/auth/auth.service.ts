import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
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
  requestCan(key:keyof RequestCapabilities){return this.requestCapabilities()?.[key]===true;}
  homePath(){return this.can('stats')&&this.can('list')?'/admission':this.requestCan('list')?'/hemo/requests':this.requestCan('bankQueue')?'/hemo/requests/bank':this.can('list')?'/admission/list':'/admission';}
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
    this.checking.set(true);this.allowed.set(false);this.capabilities.set(null);this.requestCapabilities.set(null);
    try{
      const roles=await firstValueFrom(this.http.get<CurrentRole[]>('/Identity/UserRole/GetCurrentUserRoles'));
      this.roles.set(roles??[]);
      const current=this.session();
      if(!current||!roles.length)return;
      if(!roles.some(r=>r.gkey===current.userRole))this.setSession({...current,userRole:roles[0].gkey});
      // Ask the real, scoped endpoint rather than trusting a client-side role label.
      const [admission,requests]=await Promise.allSettled([firstValueFrom(this.http.get<AdmissionCapabilities>('/Identity/PatientAdmission/Capabilities')),firstValueFrom(this.http.get<RequestCapabilities>('/Identity/BloodRequest/Capabilities'))]);
      if(!this.session())return;
      const caps=admission.status==='fulfilled'?admission.value:null;
      const req=requests.status==='fulfilled'?requests.value:null;
      this.capabilities.set(caps);this.requestCapabilities.set(req);
      this.allowed.set(Object.values(caps??{}).some(Boolean)||Object.values(req??{}).some(Boolean));
    }catch{this.allowed.set(false);}
    finally{this.checking.set(false);}
  }
  selectRole(role:number){const current=this.session();if(!current||!this.roles().some(r=>r.gkey===role))return;this.setSession({...current,userRole:role});this.allowed.set(false);location.assign('/home');}
  async logout(){
    try{if(this.session())await firstValueFrom(this.http.get('/Identity/User/UserLogout'));}catch{/* clear local session regardless */}
    this.clear();
  }
  clear(){this.session.set(null);this.roles.set([]);this.capabilities.set(null);this.requestCapabilities.set(null);this.allowed.set(false);sessionStorage.removeItem(KEY);}
}
