import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiTreeSelectComponent } from './multi-tree-select.component';

describe('MultiTreeSelectComponent', () => {
  let component: MultiTreeSelectComponent;
  let fixture: ComponentFixture<MultiTreeSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MultiTreeSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MultiTreeSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
