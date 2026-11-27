import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';



import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CaptchaService {
  constructor(
    private http: HttpClient,
   
  ) {}

  getCaptchaHtml(styleName: string) {
    const url = `${environment.apiUrl+'/captchaendpoint'}?get=html&c=${styleName}`;
    return this.http.get(url, { responseType: 'text' });
  }
}
