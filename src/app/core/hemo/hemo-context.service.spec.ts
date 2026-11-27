import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService as CompanyAuthService } from '../../Shared/Services/AuthService';
import { HemoContextService } from './hemo-context.service';
import { environment } from '../../../environments/environment';

describe('HemoContextService (R02)', () => {
  let context: HemoContextService;
  let http: HttpTestingController;
  let role: number;
  let token: string | null;
  beforeEach(() => {
    role = 10;
    token = 'test-company-session';
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(), provideHttpClientTesting(),
      { provide: CompanyAuthService, useValue: {
        GetUserRole: () => role,
        GetAccessToken: () => token,
        UserIsAthenticated: () => !!token
      } }
    ] });
    context = TestBed.inject(HemoContextService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function requests() {
    const list = http.match(r => r.method === 'GET' &&
      r.url.startsWith(environment.apiUrl.replace(/\/+$/, '') + '/Identity/') &&
      r.url.endsWith('/Capabilities'));
    expect(list.length).toBe(6);
    return list;
  }

  it('uses existing company session, with no new login or role request', async () => {
    const pending = context.refresh();
    for (const r of requests()) {
      if (r.request.url.includes('/PatientAdmission/')) r.flush({ stats: true, list: true });
      else if (r.request.url.includes('/BloodBank/')) r.flush('denied', {status: 403, statusText: 'Forbidden'});
      else r.flush({});
    }
    expect(await pending).toBeTrue();
    expect(context.read().admission?.list).toBeTrue();
    expect(context.read().bank).toBeNull();
    expect(context.checking()).toBeFalse();
  });

  it('does not ask for capabilities without an active company role or token', async () => {
    role = 0;
    expect(await context.refresh()).toBeFalse();
    token = null;
    role = 10;
    expect(await context.refresh()).toBeFalse();
    http.expectNone(r => r.url.endsWith('/Capabilities'));
    expect(context.read().admission).toBeNull();
  });

  it('rejects late results from a previously selected role', async () => {
    const first = context.refresh();
    const old = requests();
    role = 20;
    expect(context.read().admission).toBeNull();
    const second = context.refresh();
    const fresh = requests();
    for (const r of fresh) r.flush({list: false});
    expect(await second).toBeTrue();
    for (const r of old) r.flush({list: true});
    expect(await first).toBeFalse();
    expect(context.read().admission?.list).toBeFalse();
    expect(context.checking()).toBeFalse();
  });

  it('clears access on logout or company session change', async () => {
    const pending = context.refresh();
    for (const r of requests()) r.flush({list: true});
    expect(await pending).toBeTrue();
    token = null;
    expect(context.read().admission).toBeNull();
    token = 'different-session';
    expect(context.read().admission).toBeNull();
    context.reset();
    expect(context.read().admission).toBeNull();
  });
});
