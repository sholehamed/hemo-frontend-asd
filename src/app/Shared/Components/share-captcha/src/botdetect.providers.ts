import { Provider } from '@angular/core';

import { CaptchaSettings } from './captcha-settings.interface';
import { CAPTCHA_SETTINGS } from './config';

export function provideBotDetectCaptcha(config: CaptchaSettings): Provider[] {
  return [
    {
      provide: CAPTCHA_SETTINGS,
      useValue: config,
    },
  ];
}
