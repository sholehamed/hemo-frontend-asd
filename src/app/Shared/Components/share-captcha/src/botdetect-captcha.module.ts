import { HttpClientModule } from "@angular/common/http";
import { NgModule, ModuleWithProviders } from "@angular/core";
import { CaptchaEndpointPipe } from "./captcha-endpoint.pipe";
import { CaptchaHelperService } from "./captcha-helper.service";
import { CaptchaSettings } from "./captcha-settings.interface";
import { CaptchaComponent } from "./captcha.component";
import { CaptchaService } from "./captcha.service";
import { CAPTCHA_SETTINGS } from "./config";
import { CorrectCaptchaDirective } from "./correct-captcha.directive";

@NgModule({
  imports: [
    HttpClientModule,
    CaptchaEndpointPipe,    // standalone pipe
    CaptchaComponent,       // standalone component
    CorrectCaptchaDirective // standalone directive
  ],
  providers: [
    CaptchaService,
    CaptchaHelperService,
    { provide: CAPTCHA_SETTINGS, useValue: null }
  ],
  exports: [
    CaptchaComponent,
    CorrectCaptchaDirective
  ]
})


export class BotDetectCaptchaModule {

  static forRoot(config: CaptchaSettings) {
    return {
      ngModule: BotDetectCaptchaModule,
      providers: [provideBotDetectCaptcha(config)]
    };
  }

  static forChild(config: CaptchaSettings) {
    return {
      ngModule: BotDetectCaptchaModule,
      providers: [provideBotDetectCaptcha(config)]
    };
  }
}

export function provideBotDetectCaptcha(config: CaptchaSettings): any {
  return [
    {
      provide: CAPTCHA_SETTINGS,
      useValue: config
    }
  ];
}
