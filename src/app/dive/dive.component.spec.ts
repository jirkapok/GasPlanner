import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiveComponent } from './dive.component';

describe('DiveComponent', () => {
  let component: DiveComponent;
  let fixture: ComponentFixture<DiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
