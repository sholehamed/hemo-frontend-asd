import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputTreeSelectComponent } from './input-tree-select.component';

describe('InputTreeSelectComponent', () => {
  let component: InputTreeSelectComponent;
  let fixture: ComponentFixture<InputTreeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InputTreeSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InputTreeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
