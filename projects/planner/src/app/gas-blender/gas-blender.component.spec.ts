import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { GasBlenderComponent } from './gas-blender.component';
import { UnitConversion } from '../shared/UnitConversion';
import { GasBlenderService } from '../shared/gas-blender.service';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';


describe('GasBlenderComponent', () => {
    let component: GasBlenderComponent;
    let fixture: ComponentFixture<GasBlenderComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GasBlenderComponent],
            providers: [
                UnitConversion, GasBlenderService,
                ValidatorGroups, InputControls, DecimalPipe
            ]
        });
        fixture = TestBed.createComponent(GasBlenderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    // TODO test cases
    // - imperial values: source pressure, target pressure, results, AddO2, AddHe, AddTop
    // - imperial values: shows removeFrom source
});
