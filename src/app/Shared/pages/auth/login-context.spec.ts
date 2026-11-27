import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { Token, UserClient, UserLoginCommand } from '../../../Services/api-client';
import { AuthService } from '../../Services/AuthService';
import { ShareCaptchaComponent } from '../../Components/share-captcha/share-captcha.component';
import { Login } from './login';
import { LOGIN_CONTEXT_CLIENT, classifyContextToken } from './login-context';

describe('R02 company login optional context',()=>{
  let auth: jasmine.SpyObj<AuthService>;
  let user: jasmine.SpyObj<UserClient>;
  let client: {login:jasmine.Spy};
  let page: Login;
  let captcha: jasmine.Spy;
  function create(context=true) {
    TestBed.configureTestingModule({providers:context?[{provide:LOGIN_CONTEXT_CLIENT,useValue:client}]:[]});
    page=TestBed.runInInjectionContext(()=>new Login(auth,user));
    page.login=new UserLoginCommand({username:'fixture',password:'fixture-password',captchaId:'fixture-id',userEnteredCaptchaCode:'fixture-code'});
    captcha=jasmine.createSpy('RefreshCapcha');
    page.ShareCaptchaComponent={RefreshCapcha:captcha} as unknown as ShareCaptchaComponent;
  }
  beforeEach(()=>{
    auth=jasmine.createSpyObj<AuthService>('AuthService',['SetUserRole','SetToken']);
    user=jasmine.createSpyObj<UserClient>('UserClient',['login']);
    client={login:jasmine.createSpy('login')};
  });
  const valid=()=>new Token({key:'fixture-token',userRole:42,forceChangePassword:false});
  it('preserves the original company path when no route context is supplied',()=>{
    create(false);
    user.login.and.returnValue(of(valid()));
    page.GetToken();
    expect(user.login).toHaveBeenCalledOnceWith(page.login);
    expect(auth.SetToken).toHaveBeenCalled();
    expect(auth.SetUserRole).not.toHaveBeenCalled();
  });
  it('commits a successful HEMO token to the existing company role and session',()=>{
    create();
    client.login.and.returnValue(of(valid()));
    page.GetToken();
    expect(auth.SetUserRole).toHaveBeenCalledOnceWith(42);
    expect(auth.SetToken).toHaveBeenCalledOnceWith(valid(),true);
    expect(user.login).not.toHaveBeenCalled();
    expect(page.login.password).toBeUndefined();
  });
  it('never stores an OTP marker, requests fresh captcha and submits normalized OTP',()=>{
    create();
    client.login.and.returnValues(of(new Token({key:'otp'})),of(valid()));
    page.GetToken();
    expect(page.otpRequired).toBeTrue();
    expect(auth.SetToken).not.toHaveBeenCalled();
    expect(captcha).toHaveBeenCalled();
    expect(page.login.captchaId).toBeUndefined();
    page.login.captchaId='new-id';page.login.userEnteredCaptchaCode='new-code';page.login.otpCode='۱۲۳۴۵۶';
    page.GetToken();
    expect(client.login.calls.mostRecent().args[0].otpCode).toBe('123456');
    expect(auth.SetToken).toHaveBeenCalledTimes(1);
  });
  it('blocks forced password change and invalid role responses',()=>{
    create();
    client.login.and.returnValue(of(new Token({key:'fixture-token',forceChangePassword:true,userRole:42})));
    page.GetToken();
    expect(auth.SetToken).not.toHaveBeenCalled();
    expect(page.contextMessage).toContain('تغییر رمز');
    expect(classifyContextToken(new Token({key:'x',forceChangePassword:false,userRole:0}))).toBe('invalid');
    expect(classifyContextToken(null)).toBe('invalid');
    expect(classifyContextToken(new Token({key:'x',userRole:42}))).toBe('invalid');
  });
  it('ignores a late response after credentials change and prevents duplicate submit',()=>{
    create();
    const pending=new Subject<Token>();
    client.login.and.returnValue(pending);
    page.GetToken();page.GetToken();
    expect(client.login).toHaveBeenCalledTimes(1);
    page.setUsername('different');
    pending.next(valid());pending.complete();
    expect(auth.SetToken).not.toHaveBeenCalled();
    expect(page.contextBusy).toBeFalse();
  });
});
