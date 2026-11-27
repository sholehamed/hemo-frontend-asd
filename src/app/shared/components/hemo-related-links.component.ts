import { Component,OnChanges,OnDestroy,inject,input,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { HemoPageScope } from '../../core/hemo/hemo-page-scope';
import { HemoCompanyHttp } from '../../core/api/hemo-company-http';

export interface RelatedLink{
  label:string;
  pattern:string;
  commands:string[];
  query?:Record<string,string>;
}

/** Check only menu permission, not patient data. Destination guard and APIs
 * independently authorize every navigation and record read. */
@Component({
 standalone:true,selector:'app-hemo-related-links',imports:[RouterLink,MatButtonModule],
 template:`
 @if(scope.isCurrent()&&links().length){
   <div class="actions no-print">
     <button mat-stroked-button type="button" [disabled]="loading()" (click)="check()">مسیرهای مرتبط</button>
     @if(loading()){<span role="status">در حال بررسی دسترسی…</span>}
     @if(checked()){
       @for(link of permitted();track link.pattern){
         <a mat-button [routerLink]="link.commands" [queryParams]="link.query||{}">{{link.label}}</a>
       }@empty{<span class="muted">مسیر مرتبط مجاز در دسترس نیست.</span>}
     }
   </div>
 }
 `
})
export class HemoRelatedLinksComponent implements OnChanges,OnDestroy{
 readonly scope=inject(HemoPageScope);
 private readonly http=inject(HemoCompanyHttp);
 readonly links=input.required<readonly RelatedLink[]>();
 readonly permitted=signal<readonly RelatedLink[]>([]);
 readonly loading=signal(false);
 readonly checked=signal(false);
 private generation=0;
 private destroyed=false;
 ngOnChanges(){this.reset();}
 ngOnDestroy(){this.destroyed=true;this.reset();}
 private reset(){++this.generation;this.permitted.set([]);this.checked.set(false);this.loading.set(false);}
 async check(){
   if(this.destroyed||!this.scope.isCurrent()||this.loading())return;
   const generation=++this.generation;
   const links=this.links().map(link=>({...link,commands:[...link.commands],query:link.query?{...link.query}:undefined}));
   this.permitted.set([]);this.checked.set(false);this.loading.set(true);
   const current=()=>!this.destroyed&&this.scope.isCurrent()&&generation===this.generation;
   try{
     const decisions=await Promise.all(links.map(async link=>{
       try{
         const allowed=await firstValueFrom(this.http.post<boolean>('/Identity/RoleAccess/CheckPagePermission',{Menu:link.pattern}));
         return allowed===true?link:null;
       }catch{return null;}
     }));
     if(current()){this.permitted.set(decisions.filter((link):link is typeof links[number]=>link!==null));this.checked.set(true);}
   }finally{if(current())this.loading.set(false);}
 }
}
