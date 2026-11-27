import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../Shared/Services/AuthService';
import type { MenuRoleContext } from '../../Shared/layout/component/menu-role-context';
import { HemoContextService } from './hemo-context.service';

interface ScopeMarker {
  readonly generation: number;
  readonly role: number;
  readonly token: string | null;
}

/** Invalidate presentation state, never grant or change backend permissions. */
@Injectable({providedIn:'root'})
export class HemoRoleLifecycle implements MenuRoleContext {
  private readonly auth=inject(AuthService);
  private readonly router=inject(Router);
  private readonly context=inject(HemoContextService);
  private readonly generation=signal(0);

  capture(): ScopeMarker {
    return {generation:this.generation(),role:this.auth.GetUserRole(),token:this.auth.GetAccessToken()};
  }
  isCurrent(marker: ScopeMarker): boolean {
    return marker.generation===this.generation() && Number.isFinite(marker.role) && marker.role>0 &&
      marker.role===this.auth.GetUserRole() && !!marker.token && this.auth.UserIsAthenticated() &&
      marker.token===this.auth.GetAccessToken();
  }
  beforeChange(previous:number,next:number): void {
    if(previous===next)return;
    this.generation.update(n=>n+1);
    this.context.reset();
  }
  afterChange(previous:number,next:number): void {
    if(previous===next)return;
    // Leave role-scoped HEMO pages; a subsequent entry uses the original Guard.
    // Do not redirect the company's unrelated routes.
    const url=this.router.url.split(/[?#]/,1)[0];
    if(url==='/admission'||url.startsWith('/admission/')||url==='/hemo'||url.startsWith('/hemo/'))
      void this.router.navigateByUrl('/');
  }
}
