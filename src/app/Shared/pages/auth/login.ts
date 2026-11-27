import { environment } from './../../../../environments/environment';


import { Component, ViewChild } from '@angular/core';
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
                            [Required]="true" [Data]="login.username" (DataValueChange)="login.username=$event"
                            [Submitted]="Form.submitted"></app-input-string>
                        <br>

                        <app-input-password [Label]="'رمز عبور'" [Required]="true" [Data]="login.password"
                            (DataValueChange)="login.password=$event" [Submitted]="Form.submitted"></app-input-password>
                        <br>


                        <app-share-captcha (OnCaptchaIDChange)="login.captchaId=$event"
                            (OnUserEnteredCaptchaCodeChange)="login.userEnteredCaptchaCode=$event"></app-share-captcha>
                        <p-button type="Submit" label="ورود" styleClass="w-full"
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
    GetToken() {
        this.UserClient.login(this.login).subscribe(Data => {
            this.AuthService.SetToken(Data, true)
        }, e => {
            this.ShareCaptchaComponent.RefreshCapcha();
        })
    }
}

