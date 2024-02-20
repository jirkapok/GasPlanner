import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GasBlenderComponent } from './gas-blender.component';
import { UnitConversion } from '../shared/UnitConversion';
import { BasBlenderService } from '../shared/gas-blender.service';

describe('GasBlenderComponent', () => {
    let component: GasBlenderComponent;
    let fixture: ComponentFixture<GasBlenderComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GasBlenderComponent],
            providers: [
                UnitConversion, BasBlenderService
            ]
        });
        fixture = TestBed.createComponent(GasBlenderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
