import { environment } from './../../../../environments/environment';


import { Component, ViewChild, inject } from '@angular/core';
import { LOGIN_CONTEXT_CLIENT, classifyContextToken } from './login-context';
import { finalize } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { StaticFunctions } from '../../Services/StaticFunctions';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../Services/AuthService';
import { UserClient, UserGoogleLoginCommand, UserLoginCommand } from '../../../Services/api-client';
import { SocialLoginModule, SocialAuthServiceConfig, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import {
    GoogleLoginProvider,
    FacebookLoginProvider
} from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { ShareCaptchaComponent } from "../../Components/share-captcha/share-captcha.component";
import { InputStringComponent } from "../../Components/input-string/input-string.component";
import { InputPasswordComponent } from "../../Components/input-password/input-password.component";
declare global {
    interface Window {
        signInWithGoogle: (data: any) => void;
    }
}
@Component({
    selector: 'app-login',
    standalone: true,
    providers: [UserClient],
    imports: [SocialLoginModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ShareCaptchaComponent, InputStringComponent, InputPasswordComponent],
    template: `
<app-floating-configurator />
<form #Form="ngForm">
    <div class="min-h-screen bg-surface-150 dark:bg-surface-950 flex items-center justify-center p-4">
        <div class="w-full max-w-lg">
            <div class="rounded-[56px] p-1.5"
                style="background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="bg-surface-0 dark:bg-surface-900 rounded-[53px] py-10 px-6 sm:px-10">
                    <div class="text-center mb-8">
                        <img src="images/logo1.png" alt="" class="h-24 mx-auto max-w-full">
                        <div class="text-surface-900 font-bold dark:text-surface-0 text-2xl sm:text-3xl mb-4">
                            ورود به سیستم
                        </div>
                        <span class="text-muted-color font-medium">جهت ادامه لطفا وارد سیستم شوید</span>
                    </div>

                    <div>


                        <app-input-string [Label]="'نام کاربری'" [Placeholder]="'نام کاربری'" [ReadOnly]="false"
                            [Required]="true" [Data]="login.username" (DataValueChange)="setUsername($event)"
                            [Submitted]="Form.submitted"></app-input-string>
                        <br>

                        <app-input-password [Label]="'رمز عبور'" [Required]="true" [Data]="login.password"
                            (DataValueChange)="setPassword($event)" [Submitted]="Form.submitted"></app-input-password>
                        <br>


                        <app-share-captcha (OnCaptchaIDChange)="login.captchaId=$event"
                            (OnUserEnteredCaptchaCodeChange)="login.userEnteredCaptchaCode=$event"></app-share-captcha>
                        @if(contextClient && otpRequired){
                            <app-input-string [Label]="'رمز یکبار مصرف'" [Required]="true" [Direction]="'ltr'"
                                [maxlength]="6" [Data]="login.otpCode" (DataValueChange)="login.otpCode=$event"
                                [Submitted]="Form.submitted"></app-input-string>
                            <p class="text-muted-color">کد پیامک‌شده و تصویر امنیتی جدید را وارد کنید.</p>
                        }
                        @if(contextClient && contextMessage){<p role="alert">{{contextMessage}}</p>}
                        <p-button type="Submit" label="ورود" styleClass="w-full" [disabled]="contextBusy" [loading]="contextBusy"
                            (onClick)="Form.valid && GetToken()"></p-button>
                        <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                            <div class="flex items-center">
                                <!-- <p-checkbox [(ngModel)]="checked" id="rememberme1" binary class="mr-2"></p-checkbox>
                                    <label for="rememberme1">مرا به خاطر بسپار</label> -->
                            </div>
                            <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">رمز عبور
                                خود
                                را فراموش کرده اید؟</span>
                        </div>

                        <p-button label="ثبت نام" styleClass="w-full" [routerLink]="['/auth/signUp']"
                            severity="info"></p-button>
                        <br><br>

                    </div>

                </div>
            </div>
        </div>
    </div>
</form>
    `
})

export class Login {

    @ViewChild(ShareCaptchaComponent) ShareCaptchaComponent!: ShareCaptchaComponent;

    AppName = environment.AppName
    checked: boolean = false;
    ApiUrl: string = environment.apiUrl;
    user: SocialUser | null;
    constructor(private AuthService: AuthService, private UserClient: UserClient) {
        this.user = null;

    }
    login = new UserLoginCommand();
    readonly contextClient = inject(LOGIN_CONTEXT_CLIENT, {optional: true});
    otpRequired = false;
    contextBusy = false;
    contextMessage = '';

    setUsername(value: string) {
        if(this.contextClient && value !== this.login.username) this.resetOtp();
        this.login.username = value;
    }
    setPassword(value: string) {
        if(this.contextClient && value !== this.login.password) this.resetOtp();
        this.login.password = value;
    }
    private resetOtp() {
        this.otpRequired = false;
        this.login.otpCode = undefined;
        this.contextMessage = '';
    }
    private refreshContextCaptcha() {
        this.login.captchaId = undefined;
        this.login.userEnteredCaptchaCode = '';
        this.ShareCaptchaComponent.RefreshCapcha();
    }
    GetToken() {
        if(this.contextClient) {
            this.getContextToken();
            return;
        }
        this.UserClient.login(this.login).subscribe(Data => {
            this.AuthService.SetToken(Data, true)
        }, e => {
            this.ShareCaptchaComponent.RefreshCapcha();
        })
    }

    private getContextToken() {
        if(this.contextBusy || !this.contextClient) return;
        this.contextMessage = '';
        if(!this.login.captchaId || !this.login.userEnteredCaptchaCode?.trim()) {
            this.contextMessage = 'تصویر امنیتی را وارد کنید.';
            return;
        }
        const otp = this.login.otpCode?.trim().replace(/[۰-۹]/g, c=>String(c.charCodeAt(0)-1776)).replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632));
        if(this.otpRequired && !/^\d{6}$/.test(otp??'')) {
            this.contextMessage = 'رمز یکبار مصرف شش رقمی را وارد کنید.';
            return;
        }
        const request = new UserLoginCommand({...this.login, otpCode:this.otpRequired?otp:undefined});
        this.contextBusy = true;
        this.contextClient.login(request).pipe(finalize(()=>this.contextBusy=false)).subscribe({
            next: token => {
                // Do not accept a response for credentials edited while the request was pending.
                if(request.username !== this.login.username || request.password !== this.login.password) {
                    this.resetOtp();
                    this.refreshContextCaptcha();
                    return;
                }
                const state = classifyContextToken(token);
                if(state==='otp') {
                    this.otpRequired = true;
                    this.login.otpCode = undefined;
                    this.refreshContextCaptcha();
                } else if(state==='password') {
                    this.resetOtp();
                    this.login.password = undefined;
                    this.contextMessage = 'تغییر رمز عبور الزامی است. از مسیر تغییر رمز شرکت اقدام کنید.';
                    this.refreshContextCaptcha();
                } else if(state==='ok') {
                    this.resetOtp();
                    this.login.password = undefined;
                    // SetUserRole writes the exact UserRole key expected by the original interceptor.
                    this.AuthService.SetUserRole(token.userRole!);
                    this.AuthService.SetToken(token, true);
                } else {
                    this.contextMessage = 'پاسخ ورود یا نقش کاربر معتبر نیست.';
                    this.refreshContextCaptcha();
                }
            },
            error: () => {
                this.contextMessage = 'ورود انجام نشد. اطلاعات و تصویر امنیتی را دوباره بررسی کنید.';
                this.login.otpCode = undefined;
                this.refreshContextCaptcha();
            }
        });
    }
}

