import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
export interface Token { key:string;firstName:string;lastName:string;expireDate:string;forceChangePassword:boolean;multiLogin:boolean;userRole:number }
export interface CurrentRole { name:string;gkey:number;orgLocationName:string;organizationName:string }
export interface LoginRequest {username:string;password:string;userEnteredCaptchaCode:string;captchaId:string;otpCode:string|null}
const KEY='hemo-asd-session';
function read():Token|null { try { const x=JSON.parse(sessionStorage.getItem(KEY)??'null') as Token|null;return x&&x.key&&Date.parse(x.expireDate)>Date.now()?x:null; }catch{return null;} }
@Injectable({providedIn:'root'})
export class AuthService {
  private http=inject(HttpClient);
  readonly session=signal<Token|null>(read());
  readonly roles=signal<CurrentRole[]>([]);
  readonly loggedIn=computed(()=>!!this.session()&&!this.session()?.forceChangePassword);
  readonly allowed=signal(false);
  readonly checking=signal(false);
  async login(req:LoginRequest):Promise<'otp'|'password'|'ok'>{
    const token=await firstValueFrom(this.http.post<Token>('/Identity/User/Login',req));
    if(token.key==='otp')return 'otp';
    if(!token.key)throw new Error('پاسخ ورود معتبر نیست.');
    if(token.forceChangePassword)return 'password';
    this.setSession(token);await this.refreshContext();return 'ok';
  }
  private setSession(token:Token){this.session.set(token);sessionStorage.setItem(KEY,JSON.stringify(token));}
  async refreshContext(){
    if(!this.loggedIn())return;
    this.checking.set(true);this.allowed.set(false);
    try{
      const roles=await firstValueFrom(this.http.get<CurrentRole[]>('/Identity/UserRole/GetCurrentUserRoles'));
      this.roles.set(roles??[]);
      const current=this.session();
      if(!current||!roles.length)return;
      if(!roles.some(r=>r.gkey===current.userRole))this.setSession({...current,userRole:roles[0].gkey});
      // Ask the real, scoped endpoint rather than trusting a client-side role label.
      await firstValueFrom(this.http.post('/Identity/PatientAdmission/Stats',{}));
      this.allowed.set(true);
    }catch{this.allowed.set(false);}
    finally{this.checking.set(false);}
  }
  selectRole(role:number){const current=this.session();if(!current||!this.roles().some(r=>r.gkey===role))return;this.setSession({...current,userRole:role});this.allowed.set(false);location.assign('/admission');}
  async logout(){
    try{if(this.session())await firstValueFrom(this.http.get('/Identity/User/UserLogout'));}catch{/* clear local session regardless */}
    this.clear();
  }
  clear(){this.session.set(null);this.roles.set([]);this.allowed.set(false);sessionStorage.removeItem(KEY);}
}
