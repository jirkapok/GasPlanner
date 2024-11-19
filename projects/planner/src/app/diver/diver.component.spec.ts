import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DiverComponent } from './diver.component';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DiverOptions } from '../shared/models';

describe('DiverComponent', () => {
    let component: DiverComponent;
    let fixture: ComponentFixture<DiverComponent>;
    let unitConversion: UnitConversion;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DiverComponent],
            imports: [ReactiveFormsModule],
            providers: [
                UnitConversion,
                ValidatorGroups,
                InputControls,
                DecimalPipe
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DiverComponent);
        component = fixture.componentInstance;
        unitConversion = TestBed.inject(UnitConversion);
        component.diver = new DiverOptions();
        fixture.detectChanges();
    });

    it('should change rmv and stressRmv values and emit', () => {
        expect(component.diver.rmv).toBe(20);
        expect(component.diver.stressRmv).toBe(30);

        const newRmv = 15;
        const newStressRmv = 25;

        component.diverForm.setValue({ rmv: newRmv, stressRmv: newStressRmv });

        let wasEmitted = false;
        component.changed.subscribe(() => wasEmitted = true);

        component.inputChanged();

        expect(component.diver.rmv).toBe(unitConversion.toLiter(newRmv));
        expect(component.diver.stressRmv).toBe(unitConversion.toLiter(newStressRmv));
        expect(wasEmitted).toBeTrue();
    });

    it('should change new value of maxPpO2 and emit', () => {
        expect(component.diver.maxPpO2).toBe(1.4);

        const newPpO2 = 1.2;
        let wasEmitted = false;
        component.changed.subscribe(() => wasEmitted = true);

        component.maxPpO2Changed(newPpO2);

        expect(component.diver.maxPpO2).toBe(newPpO2);
        expect(wasEmitted).toBeTrue();
    });

    it('should change new value of maxDecoPpO2 and emit', () => {
        expect(component.diver.maxDecoPpO2).toBe(1.6);

        const newDecoPpO2 = 1.4;
        let wasEmitted = false;
        component.changed.subscribe(() => wasEmitted = true);

        component.maxDecoPpO2Changed(newDecoPpO2);

        expect(component.diver.maxDecoPpO2).toBe(newDecoPpO2);
        expect(wasEmitted).toBeTrue();
    });

    it('should change rmvStep when switching to imperial units', () => {
        expect(component.rmvStep).toBe(2);

        unitConversion.imperialUnits = true;

        fixture.detectChanges();

        expect(component.rmvStep).toBe(0.1);
    });
});
