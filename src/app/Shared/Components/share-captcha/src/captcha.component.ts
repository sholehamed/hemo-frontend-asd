import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CaptchaService } from './captcha.service';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from "./safe-html.pipe";
import { ButtonModule } from 'primeng/button';
import { InputStringComponent } from "../../input-string/input-string.component";
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-captcha',
  standalone: true,
  imports: [CommonModule, FormsModule, SafeHtmlPipe, ButtonModule],
  template: `

  <div style="display: flex; align-items: center; gap: 5px;">
      <div [innerHTML]="captchaHtml | safeHtml"></div>
        <p-button label="تغییر تصویر" (onClick)="reloadImage()" variant="text" [raised]="true" severity="info" size="small" />
    </div>
  
  `,
})
export class CaptchaComponent implements OnInit {
  @Input() captchaStyleName: string = 'NftCaptchaStyle';
  @Output() captchaLoaded = new EventEmitter<string>();
  @Output() OnCaptchaIDChange = new EventEmitter<string>();
  captchaHtml: string = '';
  userInput: string = '';

  constructor(private captchaService: CaptchaService) { }

  ngOnInit() {
    this.loadCaptcha();
  }


  loadCaptcha() {
    this.captchaService.getCaptchaHtml(this.captchaStyleName).subscribe({
      next: (html) => {
        let apiUrl=environment.apiUrl;
         apiUrl= ((window.location.href.includes('.bolut.ir'))) ? apiUrl : apiUrl.toLowerCase().replace('https://', 'http://').replace('.bolut.ir', '.bolut.net')
        html = html
          .replaceAll('src="', `src="${apiUrl}/`)
          .replace(/href="(captchaendpoint[^"]*)"/g, `href="${apiUrl}/$1"`)
          .replace(/src="(captchaendpoint[^"]*)"/g, `src="${apiUrl}/$1"`);

        html = html.replaceAll(
          'BotDetect CAPTCHA ASP.NET Form Validation',
          'Bolut CAPTCHA  Validation'
        );

        html = html.replace(
          /<a[^>]*class="BDC_SoundLink"[\s\S]*?<\/a>/,
          ''
        );
        this.extractCaptchaId(html);
        this.captchaHtml = html;
        this.captchaLoaded.emit(html);
      },
      error: (err) => console.error(err),
    });
  }
  extractCaptchaId(html: string)  {
    const regex = /<input[^>]*id="BDC_VCID_NftCaptchaStyle"[^>]*value="([^"]+)"[^>]*>/i;
    const match = html.match(regex);
    let id= match ? match[1] : null;
    this.OnCaptchaIDChange.emit(id!)
  }


  reloadImage() {
    this.loadCaptcha();
  }
}
