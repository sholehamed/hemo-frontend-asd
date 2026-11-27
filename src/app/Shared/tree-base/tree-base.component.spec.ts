import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../testing/company-test-providers';
import { TreeBaseComponent } from './tree-base.component';
describe('TreeBaseComponent', () => {
  let fixture: ComponentFixture<TreeBaseComponent>;
  let component: TreeBaseComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [TreeBaseComponent], providers: companyTestProviders()}).compileComponents();
    fixture = TestBed.createComponent(TreeBaseComponent);
    component = fixture.componentInstance;
    component.DataUrl = 'fixture/tree';
    fixture.detectChanges();
    const requests = TestBed.inject(HttpTestingController).match(r => r.method === 'POST' && r.url.endsWith('/fixture/tree'));
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) request.flush({data: [], pageNumber: 1, totalPages: 0, totalCount: 0});
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => { expect(component).toBeTruthy(); });
});
