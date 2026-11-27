import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Token, UserLoginCommand } from '../../../Services/api-client';

// Optional route-level context; the default company login remains unchanged.
export interface LoginContextClient {
  login(command: UserLoginCommand): Observable<Token>;
}
export const LOGIN_CONTEXT_CLIENT = new InjectionToken<LoginContextClient>('Company login context client');
export function classifyContextToken(token: Token | null | undefined): 'otp'|'password'|'ok'|'invalid' {
  if(token?.key==='otp') return 'otp';
  if(!token?.key || !token.key.trim()) return 'invalid';
  if(token.forceChangePassword===true) return 'password';
  if(token.forceChangePassword!==false || !Number.isSafeInteger(token.userRole) || token.userRole!<=0) return 'invalid';
  return 'ok';
}
