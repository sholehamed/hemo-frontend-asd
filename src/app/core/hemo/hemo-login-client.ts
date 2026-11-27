import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { Token, UserLoginCommand } from '../../Services/api-client';
import type { LoginContextClient } from '../../Shared/pages/auth/login-context';
import { HemoCompanyHttp } from '../api/hemo-company-http';

// Use the existing backend HEMO role-context endpoint, which delegates to
// the company UserLoginCommand (captcha, password, OTP and token issuance).
// No token/session storage or additional authentication mechanism.
@Injectable({providedIn:'root'})
export class HemoLoginClient implements LoginContextClient {
  private readonly http = inject(HemoCompanyHttp);
  login(command: UserLoginCommand) {
    return this.http.post<Token>('/Identity/HemoSession/Login',command)
      .pipe(map(token=>Token.fromJS(token)));
  }
}
