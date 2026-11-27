import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../Services/api-client';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoRoleLifecycle } from '../../core/hemo/hemo-role-lifecycle';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';
import { HemoRelatedLinksComponent,RelatedLink } from './hemo-related-links.component';

describe('R02 related workflow navigation',()=>{
 let current:boolean,http:HttpTestingController;
 const endpoint='https://fixture.invalid/Identity/RoleAccess/CheckPagePermission';
 const links:RelatedLink[]=[
   {label:'پرونده پذیرش',pattern:'/admission/detail/:guid',commands:['/admission/detail','admission-a']},
   {label:'سوابق تزریق',pattern:'/hemo/transfusion/records',commands:['/hemo/transfusion/records'],query:{admission:'admission-a'}}
 ];
 const json=(v:unknown)=>new Blob([JSON.stringify(v)],{type:'application/json'});
 beforeEach(()=>{
   current=true;
   TestBed.configureTestingModule({providers:[provideRouter([]),provideNoopAnimations(),provideHttpClient(),provideHttpClientTesting(),HemoPageScope,HemoCompanyHttp,
     {provide:API_BASE_URL,useValue:'https://fixture.invalid'},
     {provide:HemoRoleLifecycle,useValue:{capture:()=>({}),isCurrent:()=>current}}]});
   http=TestBed.inject(HttpTestingController);
 });
 afterEach(()=>http.verify());
 function fixture(){
   const f=TestBed.createComponent(HemoRelatedLinksComponent);f.componentRef.setInput('links',links);f.detectChanges();return f;
 }
 it('checks exact page patterns only on demand without changing current page header',async()=>{
   const f=fixture(),c=f.componentInstance;http.expectNone(endpoint);
   const original=sessionStorage.getItem('url');
   const task=c.check();const requests=http.match(endpoint);
   expect(requests.map(r=>r.request.body)).toEqual([{Menu:'/admission/detail/:guid'},{Menu:'/hemo/transfusion/records'}]);
   requests[0].flush(json(false));requests[1].flush(json(true));await task;f.detectChanges();
   expect(c.permitted().map(x=>x.pattern)).toEqual(['/hemo/transfusion/records']);
   const anchor=f.nativeElement.querySelector('a') as HTMLAnchorElement;
   expect(anchor.getAttribute('href')).toBe('/hemo/transfusion/records?admission=admission-a');
   expect(sessionStorage.getItem('url')).toBe(original);f.destroy();
 });
 it('fails closed on rejected permission requests and non-boolean response',async()=>{
   const f=fixture(),c=f.componentInstance;const task=c.check();const requests=http.match(endpoint);
   requests[0].flush(json({detail:'denied'}),{status:403,statusText:'Forbidden'});requests[1].flush(json('true'));await task;
   expect(c.permitted()).toEqual([]);expect(c.checked()).toBeTrue();f.destroy();
 });
 it('ignores previous-record decisions when the record changes',async()=>{
   const f=fixture(),c=f.componentInstance;const old=c.check();const first=http.match(endpoint);
   f.componentRef.setInput('links',[{...links[0],commands:['/admission/detail','admission-b']}]);f.detectChanges();
   const fresh=c.check();http.expectOne(endpoint).flush(json(true));await fresh;
   first.forEach(r=>r.flush(json(true)));await old;
   expect(c.permitted().map(x=>x.commands)).toEqual([['/admission/detail','admission-b']]);f.destroy();
 });
 it('does not render links or accept late results after role invalidation',async()=>{
   const f=fixture(),c=f.componentInstance;const task=c.check();const requests=http.match(endpoint);
   current=false;requests.forEach(r=>r.flush(json(true)));await task;f.detectChanges();
   expect(c.permitted()).toEqual([]);expect(f.nativeElement.querySelector('a')).toBeNull();
   await c.check();http.expectNone(endpoint);f.destroy();
 });
});
