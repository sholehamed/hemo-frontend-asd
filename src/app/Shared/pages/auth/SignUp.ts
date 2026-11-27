import { UserSignUpCommand } from './../../../Services/api-client';
import { environment } from './../../../../environments/environment';


import { Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AuthService } from '../../Services/AuthService';
import { UserClient, UserGoogleLoginCommand, UserLoginCommand } from '../../../Services/api-client';
import { SocialLoginModule, SocialAuthServiceConfig, SocialAuthService, SocialUser } from '@abacritt/angularx-social-login';
import {
    GoogleLoginProvider,
    FacebookLoginProvider
} from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';
import { InputStringComponent } from "../../Components/input-string/input-string.component";
import { InputPasswordComponent } from "../../Components/input-password/input-password.component";
import { StaticFunctions } from '../../Services/StaticFunctions';
import { MessageService } from 'primeng/api';
import { InputNumberComponent } from "../../Components/input-number/input-number.component";
import { ShareCaptchaComponent } from "../../Components/share-captcha/share-captcha.component";
import { DateInputComponent } from "../../Components/date-input/date-input.component";
declare global {
    interface Window {
        signInWithGoogle: (data: any) => void;
    }
}
@Component({
    selector: 'app-SignUp',
    standalone: true,
    providers: [UserClient,
        SocialAuthService,
        {
            provide: 'SocialAuthServiceConfig',
            useValue: {
                autoLogin: false,
                lang: 'fa',
                providers: [
                    {
                        id: GoogleLoginProvider.PROVIDER_ID,
                        provider: new GoogleLoginProvider('456808262525-egn6as75d6poe9mvcj9s9csao2jb0m6l.apps.googleusercontent.com', {


                        }),


                    },

                ],
                onError: (err) => {
                    console.error(err);
                },
            } as SocialAuthServiceConfig,
        },

    ],
    imports: [SocialLoginModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, InputStringComponent, InputPasswordComponent, InputNumberComponent, ShareCaptchaComponent, DateInputComponent],
    template: `
<div class="min-h-screen bg-surface-150 dark:bg-surface-950 flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
        <div class="rounded-[56px] p-1.5"
            style="background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
            <div class="bg-surface-0 dark:bg-surface-900 rounded-[53px] py-5 px-6 sm:px-10">
                <div class="text-center ">
                    <img src="images/logo1.png" alt="" class="h-24 mx-auto max-w-full">
                    <div class="text-surface-900 font-bold dark:text-surface-0 text-2xl sm:text-3xl mb-4">
                        ثبت نام
                    </div>
                    <span class="text-muted-color font-medium">جهت ادامه لطفا وارد سیستم شوید</span>
                </div>
                <form #Form="ngForm">
                    <br>
                    <div class="grid grid-cols-12 gap-8">
                        <div class="col-span-12">
                            <app-input-string [Label]="'کد ملی'" [Placeholder]="'کد ملی'" [ReadOnly]="false"
                                [Required]="true" [Data]="UserSignUpCommand.username"
                                (DataValueChange)="UserSignUpCommand.username=$event"
                                [Submitted]="Form.submitted"></app-input-string>
                        </div>
                         <div class="col-span-12">
                            <app-date-input [Label]="'تاریخ تولد'" [ReadOnly]="false"
                                [Required]="true" [Data]="UserSignUpCommand.birthDate"
                                (DataValueChange)="UserSignUpCommand.birthDate=$event"
                                [Submitted]="Form.submitted"></app-date-input>
                        </div>
                        <div class="col-span-12">
                            <app-input-number [Label]="'موبایل'" [Placeholder]="'موبایل'" [ReadOnly]="false"
                                [Required]="true" [Data]="UserSignUpCommand.mobile" [minlength]="11" [maxlength]="11"
                                (DataValueChange)="UserSignUpCommand.mobile=$event"
                                [Submitted]="Form.submitted"></app-input-number>
                        </div>
                
                        
                        <div class="col-span-12">
                            <app-input-string [Label]="'ایمیل'" [Placeholder]="'ایمیل'" [ReadOnly]="false"
                                [Required]="true" [Data]="UserSignUpCommand.email"
                                (DataValueChange)="UserSignUpCommand.email=$event"
                                [Submitted]="Form.submitted"></app-input-string>
                        </div>
                                      
                        <div class="col-span-12">
                            <app-input-password [Label]="'رمز عبور'" [Required]="true"
                                [Data]="UserSignUpCommand.password"
                                (DataValueChange)="UserSignUpCommand.password=$event"
                                [Submitted]="Form.submitted"></app-input-password>
                        </div>
                        <div class="col-span-12">
                            <app-input-password [Label]="'تکرار رمز عبور'" [Required]="true" [Data]="ConfirmPassword"
                                (DataValueChange)="ConfirmPassword=$event"
                                [Submitted]="Form.submitted"></app-input-password>
                        </div>
                    </div>
<br>
              
                <div>
                                <app-share-captcha (OnCaptchaIDChange)="UserSignUpCommand.captchaId=$event"
                            (OnUserEnteredCaptchaCodeChange)="UserSignUpCommand.userEnteredCaptchaCode=$event"></app-share-captcha>

                    <p-button label="ثبت نام" styleClass="w-full" type="Submit" (onClick)="Form.valid &&  signUp()"></p-button>
                    <br><br>
                    <p-button label="قبلا ثبت نام کرده اید؟" styleClass="w-full" [routerLink]="['/auth/login']"
                        severity="info"></p-button>
                    <br><br>

                    <div id="g_id_onload"
                        data-client_id="456808262525-egn6as75d6poe9mvcj9s9csao2jb0m6l.apps.googleusercontent.com"
                        data-context="use" data-ux_mode="popup" data-callback="OnSignInWithGoogle" data-nonce=""
                        data-auto_prompt="false">
                    </div>

                    <div class="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline"
                        data-text="signin_with" data-size="large" data-locale="fa" data-logo_alignment="left">
                    </div>
                </div>
                </form>
            </div>
        </div>
    </div>
</div>
    `
})

export class SignUp {

    AppName = environment.AppName
    ApiUrl: string = environment.apiUrl;
    user: SocialUser | null;
    UserSignUpCommand: UserSignUpCommand = new UserSignUpCommand();
    ConfirmPassword: string = "";
    constructor(private AuthService: AuthService,private Router:Router, private UserClient: UserClient, private MessageService: MessageService, private socialAuthService: SocialAuthService) {
        this.user = null;

        window['signInWithGoogle'] = this.signInWithGoogle.bind(this);


    }
    signInWithGoogle(data: any) {
        let login = new UserGoogleLoginCommand();
        login.credential = data.credential
        this.UserClient.googleLogin(login).subscribe(Data => {
            this.AuthService.SetToken(Data, true)
        })
    }

    @ViewChild(ShareCaptchaComponent) ShareCaptchaComponent!: ShareCaptchaComponent;
    signUp() {

        if (this.UserSignUpCommand.password != this.ConfirmPassword) {
            StaticFunctions.ShowError(this.MessageService, 'رمز عبور و تکرار رمز عبور با هم مطابقت ندارد')
            return;
        }

        if (this.UserSignUpCommand.mobile != null && this.UserSignUpCommand.mobile != '' && !this.UserSignUpCommand.mobile.toString().startsWith('0')) {
            this.UserSignUpCommand.mobile = '0' + this.UserSignUpCommand.mobile.toString()
        }
        this.UserSignUpCommand.mobile = this.UserSignUpCommand.mobile?.toString()

        this.UserClient.signUp(this.UserSignUpCommand).subscribe(Data => {
            StaticFunctions.ShowSuccess(this.MessageService)
            this.Router.navigate(['/auth/login'])
        }, e => {
            this.ShareCaptchaComponent.RefreshCapcha();
        })
    }
}


