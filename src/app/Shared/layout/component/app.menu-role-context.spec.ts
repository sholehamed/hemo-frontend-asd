import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AuthService } from '../../Services/AuthService';
import { MenuClient, MenuBindUserMenuDTO } from '../../../Services/api-client';
import { AppMenu } from './app.menu';
import { MENU_ROLE_CONTEXT } from './menu-role-context';
describe('R02 original company menu role hook',()=>{
  it('invalidates before commit, clears stale menu and ignores late responses',()=>{
    let role=42;
    const order:string[]=[];
    const first=new Subject<MenuBindUserMenuDTO[]>(),second=new Subject<MenuBindUserMenuDTO[]>();
    const menuClient={menuBindUserMenu:jasmine.createSpy().and.returnValues(first,second)};
    const auth={GetUserRole:()=>role,GetAccessToken:()=> 'fixture-token',SetUserRole:(value:number)=>{order.push('set');role=value;}};
    const hook={beforeChange:()=>order.push('before'),afterChange:()=>order.push('after')};
    TestBed.configureTestingModule({providers:[{provide:MENU_ROLE_CONTEXT,useValue:hook}]});
    const old=sessionStorage.getItem('orgLocationName');
    const menu=TestBed.runInInjectionContext(()=>new AppMenu(menuClient as unknown as MenuClient,auth as unknown as AuthService));
    try {
      first.next([{label:'old'} as MenuBindUserMenuDTO]);expect(menu.model[0].label).toBe('old');
      order.length=0;menu.SetUserRole(43);expect(order).toEqual(['before','set','after']);
      expect(menu.model.length).toBe(0);expect(menu.UserRole).toBe(43);
      first.next([{label:'late'} as MenuBindUserMenuDTO]);expect(menu.model.length).toBe(0);
      second.next([{label:'new'} as MenuBindUserMenuDTO]);expect(menu.model[0].label).toBe('new');
      menu.ngOnDestroy();second.next([{label:'after destroy'} as MenuBindUserMenuDTO]);expect(menu.model[0].label).toBe('new');
    }finally{
      menu.ngOnDestroy();
      if(old===null)sessionStorage.removeItem('orgLocationName');else sessionStorage.setItem('orgLocationName',old);
    }
  });
});
