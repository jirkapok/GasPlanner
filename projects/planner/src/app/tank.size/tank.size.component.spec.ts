import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TankSizeComponent } from './tank.size.component';
import { UnitConversion } from '../shared/UnitConversion';

describe('TankSizeComponent', () => {
  let component: TankSizeComponent;
  let fixture: ComponentFixture<TankSizeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TankSizeComponent],
      providers: [UnitConversion]
    });
    fixture = TestBed.createComponent(TankSizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
