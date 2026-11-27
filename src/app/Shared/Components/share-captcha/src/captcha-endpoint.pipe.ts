import { Pipe, PipeTransform, Inject } from '@angular/core';
import { CAPTCHA_SETTINGS } from './config';


@Pipe({
  name: 'captchaEndpoint',
  standalone: true,
})
export class CaptchaEndpointPipe implements PipeTransform {
  constructor(@Inject(CAPTCHA_SETTINGS) private settings: { captchaEndpoint: string }) {}

  transform(value: string): string {
    return `${this.settings.captchaEndpoint}?get=${value}`;
  }
}
