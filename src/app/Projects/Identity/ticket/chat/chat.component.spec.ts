import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { companyTestProviders } from '../../../../testing/company-test-providers';
import { ChatComponent } from './chat.component';
describe('ChatComponent', () => {
  let fixture: ComponentFixture<ChatComponent>;
  let component: ChatComponent;
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [ChatComponent], providers: companyTestProviders()}).compileComponents();
    fixture = TestBed.createComponent(ChatComponent);
    component = fixture.componentInstance;
    component.TicketGUID = 'fixture-ticket';
    fixture.detectChanges();
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.method === 'GET' && r.url.endsWith('/Identity/TicketMessage/FindAll/fixture-ticket'));
    request.flush(new Blob(['[]'], {type: 'application/json'}));
    await fixture.whenStable();
    fixture.detectChanges();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('should create', () => { expect(component).toBeTruthy(); });
});
