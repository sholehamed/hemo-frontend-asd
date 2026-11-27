import { InjectionToken } from '@angular/core';

// Optional application-specific lifecycle hook. No role or authentication implementation.
export interface MenuRoleContext {
  beforeChange(previous: number, next: number): void;
  afterChange(previous: number, next: number): void;
}
export const MENU_ROLE_CONTEXT = new InjectionToken<MenuRoleContext>('Menu role lifecycle');
