import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrglocationRoleAccessComponent } from './orglocation-role-access.component';

describe('OrglocationRoleAccessComponent', () => {
  let component: OrglocationRoleAccessComponent;
  let fixture: ComponentFixture<OrglocationRoleAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrglocationRoleAccessComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrglocationRoleAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
