import { Directive, Input, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[correctCaptcha]',
  standalone: true,
})
export class CorrectCaptchaDirective {
  @Input() captchaValue!: string;
  @Output() success = new EventEmitter<string>();

  checkCaptcha() {
    if (this.captchaValue && this.captchaValue.length > 0) {
      this.success.emit(this.captchaValue);
    }
  }
}
