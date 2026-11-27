import { Component, Input, AfterViewInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CaptchaComponent } from './src/captcha.component';
import { InputStringComponent } from "../input-string/input-string.component";
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-share-captcha',
  standalone: true,
  imports: [CaptchaComponent, FormsModule, InputStringComponent],
  templateUrl: './share-captcha.component.html',
  styleUrls: ['./share-captcha.component.scss']
})
export class ShareCaptchaComponent implements AfterViewInit {
  @ViewChild(CaptchaComponent) CaptchaComponent!: CaptchaComponent;
  @Output() OnUserEnteredCaptchaCodeChange = new EventEmitter<string>();
  @Output() OnCaptchaIDChange = new EventEmitter<string>();
  @Input() Submitted: boolean = false
  safeHtmlCaptcha?: SafeHtml;
  UserEnteredCaptchaCode: string = ''

  constructor(private sanitizer: DomSanitizer) { }

  ngAfterViewInit(): void { }

  onCaptchaLoaded(html: string) {
    this.safeHtmlCaptcha = this.sanitizer.bypassSecurityTrustHtml(html);
  }


  capchaChange(captchaId: any): void {
   this.OnCaptchaIDChange.emit(captchaId)
  }

  RefreshCapcha(): void {
    this.UserEnteredCaptchaCode = '';
    this.CaptchaComponent.reloadImage();
  }
  UserCaptchaChange(value: string) {
    this.OnUserEnteredCaptchaCodeChange.emit(value);
  }

  CaptchaIDChange(value: string) {
    this.UserEnteredCaptchaCode = '';
    this.OnUserEnteredCaptchaCodeChange.emit('');
    this.OnCaptchaIDChange.emit(value)
  }
}
