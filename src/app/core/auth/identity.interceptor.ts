import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { toApiFailure } from '../api/api-error';
export const identityInterceptor:HttpInterceptorFn=(request,next)=>{
  const auth=inject(AuthService),router=inject(Router),token=auth.session();
  const isApi=request.url.startsWith('/Identity/');
  const secured=isApi&&request.url!=='/Identity/User/Login'&&token;
  const req=secured?request.clone({setHeaders:{Authorization:'Bearer '+token.key,UserRole:String(token.userRole),'X-Page-Route':router.url.split('?')[0]}}):request;
  return next(req).pipe(catchError(e=>{
    if(e instanceof HttpErrorResponse){
      if(e.status===401&&secured){auth.clear();void router.navigateByUrl('/login');}
      const safe=toApiFailure(e);
      // ASD business errors are ProblemDetails; show only bounded validation/detail messages to the current user.
      const body=e.error as {detail?:unknown;errors?:Record<string,unknown>}|null;
      let detail='';
      if(e.status===400&&body&&typeof body==='object'){
        if(typeof body.detail==='string')detail=body.detail.slice(0,500);
        else if(body.errors&&typeof body.errors==='object')detail=Object.values(body.errors).flatMap(v=>Array.isArray(v)?v.filter(x=>typeof x==='string'):[]).join('؛ ').slice(0,500);
      }
      return throwError(()=>({...safe,message:detail||safe.message}));
    }
    return throwError(()=>e);
  }));
};
