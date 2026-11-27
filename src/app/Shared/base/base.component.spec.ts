import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../testing/company-test-providers';
import { BaseComponent } from './base.component';
describe('BaseComponent', () => {
  let fixture: ComponentFixture<BaseComponent>;
  let component: BaseComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [BaseComponent], providers: companyTestProviders()}).compileComponents();
    fixture = TestBed.createComponent(BaseComponent);
    component = fixture.componentInstance;
    component.DataUrl = 'fixture/base';
    fixture.detectChanges();
    const requests = TestBed.inject(HttpTestingController).match(r => r.method === 'POST' && r.url.endsWith('/fixture/base'));
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) request.flush({data: [], pageNumber: 1, totalPages: 0, totalCount: 0});
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => { expect(component).toBeTruthy(); });
});
