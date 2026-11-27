import { Injectable, inject, OnDestroy, signal } from '@angular/core';
import { HemoRoleLifecycle } from './hemo-role-lifecycle';
@Injectable()
export class HemoPageScope implements OnDestroy {
  private readonly lifecycle=inject(HemoRoleLifecycle);
  private readonly marker=this.lifecycle.capture();
  private readonly invalid=signal(false);
  isCurrent():boolean {return !this.invalid()&&this.lifecycle.isCurrent(this.marker);}
  invalidate():void {this.invalid.set(true);}
  assertCurrent():void {
    if(!this.isCurrent())throw new Error('نقش یا نشست تغییر کرده است؛ صفحه را دوباره باز کنید.');
  }
  ngOnDestroy():void {this.invalidate();}
}
