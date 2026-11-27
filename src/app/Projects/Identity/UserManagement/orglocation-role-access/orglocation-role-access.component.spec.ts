import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../../testing/company-test-providers';
import { OrglocationRoleAccessComponent } from './orglocation-role-access.component';
describe('OrglocationRoleAccessComponent', () => {
  let fixture: ComponentFixture<OrglocationRoleAccessComponent>;
  let component: OrglocationRoleAccessComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [OrglocationRoleAccessComponent], providers: companyTestProviders()}).compileComponents();
    fixture = TestBed.createComponent(OrglocationRoleAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.method === 'GET' && r.url.endsWith('/Identity/OrglocationPackage/GetCurrentUserPacks'));
    request.flush(new Blob(['[]'], {type: 'application/json'}));
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => { expect(component).toBeTruthy(); });
});
