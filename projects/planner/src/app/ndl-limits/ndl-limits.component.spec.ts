import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NdlLimitsComponent } from './ndl-limits.component';

describe('NdlLimitsComponent', () => {
  let component: NdlLimitsComponent;
  let fixture: ComponentFixture<NdlLimitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NdlLimitsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NdlLimitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
