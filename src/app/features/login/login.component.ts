import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';
import { RequestStateComponent } from '../../shared/components/request-state.component';
interface Captcha {getUserEnteredCaptchaCode():string;getCaptchaId():string;reloadCaptcha():void}
interface JQueryCaptcha {captcha(options:{captchaEndpoint:string}):Captcha}
declare const $:(el:HTMLElement)=>JQueryCaptcha;
@Component({selector:'app-login',standalone:true,imports:[ReactiveFormsModule,MatButtonModule,RequestStateComponent],template:`
<div class="login-page"><div class="login-wrap">
  <div class="login-brand"><span>🩸</span><h1>سامانه هموویژیلانس</h1><p dir="ltr">Blood Transfusion Monitoring System</p></div>
  <form class="login-card" [formGroup]="form" (ngSubmit)="submit()">
    <h2>ورود به سامانه</h2><p class="muted">با حساب سازمانی خود وارد شوید.</p>
    <label>نام کاربری<input formControlName="username" dir="ltr" autocomplete="username"></label>
    <label>رمز عبور<input type="password" formControlName="password" dir="ltr" autocomplete="current-password"></label>
    @if(otp()){<label>رمز یک‌بار مصرف<input formControlName="otpCode" inputmode="numeric" autocomplete="one-time-code"></label>}
    <label>کد امنیتی</label>
    <div #captchaElement data-captchastylename="NftCaptchaStyle" class="captcha-box" dir="ltr"></div>
    <label class="sr-only" for="NftCaptchaUserInput">کد امنیتی</label><input id="NftCaptchaUserInput" inputmode="numeric" autocomplete="off" dir="ltr">
    <button class="plain-link" type="button" (click)="reload()">تصویر جدید</button>
    <app-request-state [loading]="busy()" [error]="error()"/>
    <button mat-flat-button class="primary-button full" type="submit" [disabled]="busy()||form.invalid||!captchaReady()">{{otp()?'تأیید رمز و ورود':'ورود به سامانه'}}</button>
  </form><p class="login-foot">سامانه یکپارچه مراقبت و نظارت بر مصرف خون</p>
</div></div>`,styles:[`
.login-page{min-height:100dvh;display:grid;place-items:center;background:linear-gradient(135deg,#0f172a,#1e293b 55%,#1e3a8a);padding:20px}.login-wrap{width:min(100%,460px)}.login-brand{text-align:center;color:#fff;margin-bottom:24px}.login-brand span{font-size:48px}.login-brand h1{font-size:23px;color:white;margin:8px 0}.login-brand p,.login-foot{color:#94a3b8;text-align:center;font-size:12px}.login-card{display:grid;gap:12px;padding:26px;background:#ffffff;border-radius:16px;box-shadow:0 20px 60px #0005}.login-card h2{margin:0;font-size:20px}.login-card label{display:grid;gap:5px}.captcha-box{min-height:55px;overflow:auto}.plain-link{border:0;background:transparent;color:#17629c;cursor:pointer;justify-self:start}.full{width:100%}.login-foot{margin:18px 0}.sr-only{position:absolute;clip:rect(0,0,0,0)}
`]})
export class LoginComponent implements AfterViewInit{
  @ViewChild('captchaElement') captchaElement!:ElementRef<HTMLElement>;
  private fb=inject(FormBuilder);private auth=inject(AuthService);private router=inject(Router);
  private captcha:Captcha|null=null;
  readonly busy=signal(false);readonly error=signal<string|null>(null);readonly otp=signal(false);readonly captchaReady=signal(false);
  readonly form=this.fb.nonNullable.group({username:['',Validators.required],password:['',Validators.required],otpCode:['']});
  ngAfterViewInit(){try{this.captcha=$(this.captchaElement.nativeElement).captcha({captchaEndpoint:'/captchaendpoint'});this.captchaReady.set(true);}catch{this.error.set('سرویس کد امنیتی در دسترس نیست.');}}
  reload(){this.captcha?.reloadCaptcha();}
  async submit(){
    if(this.form.invalid||this.busy()||!this.captcha)return;
    this.busy.set(true);this.error.set(null);
    try{const v=this.form.getRawValue();const result=await this.auth.login({...v,otpCode:v.otpCode||null,captchaId:this.captcha.getCaptchaId(),userEnteredCaptchaCode:this.captcha.getUserEnteredCaptchaCode()});
      if(result==='otp'){this.otp.set(true);this.error.set('رمز یک‌بار مصرف ارسال شد. کد امنیتی جدید را نیز وارد کنید.');this.reload();}
      else if(result==='password'){this.error.set('رمز عبور باید از مسیر مدیریت حساب سازمانی تغییر کند.');this.reload();}
      else void this.router.navigateByUrl(this.auth.homePath());
    }catch(e){this.error.set((e as {message?:string}).message??'ورود انجام نشد.');this.reload();}
    finally{this.busy.set(false);}
  }
}
