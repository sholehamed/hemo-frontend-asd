import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareCaptchaComponent } from './share-captcha.component';

describe('ShareCaptchaComponent', () => {
  let component: ShareCaptchaComponent;
  let fixture: ComponentFixture<ShareCaptchaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareCaptchaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShareCaptchaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
