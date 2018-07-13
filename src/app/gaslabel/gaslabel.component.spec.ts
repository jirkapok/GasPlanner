import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GaslabelComponent } from './gaslabel.component';

describe('GaslabelComponent', () => {
  let component: GaslabelComponent;
  let fixture: ComponentFixture<GaslabelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GaslabelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GaslabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
