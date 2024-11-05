import { ReactiveFormsModule } from '@angular/forms';
import {NonNullableFormBuilder, FormGroup}
import {DiverComponent} from'./diver.component';
import { DecimalPipe } from '@angular/common';
import { UnitConversion } from '../shared/UnitConversion';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import { DiverOptions } from '../shared/models';

describe('DiverComponent', () => {
    let component: DiverComponent;
    let unitConversion: UnitConversion;

    beforeEach(() => {
        const formBuilder = new NonNullableFormBuilder();
        const decimalPipe = new DecimalPipe('en-US');
        const inputControls = new InputControls(decimalPipe);
        unitConversion = new UnitConversion();
        const validatorGroups = new ValidatorGroups(unitConversion);


        component = new DiverComponent(
            formBuilder,
            inputControls,
            validatorGroups,
            unitConversion
        );

            component.diverForm = formBuilder.group({
            rmv: ['20'],
            stressRmv: ['25']
        });

        component.diver = new DiverOptions();
    });

    describe('inputChanged', () => {
        it('should update rmv and stressRmv values in liters and emit changes', () => {
            const rmv = 15;
            const stressRmv = 20;
            component.diverForm.setValue({ rmv: rmv, stressRmv: stressRmv });
            let wasEmitted = false;
            component.changed.subscribe(() => wasEmitted = true);

            component.inputChanged();

            expect(component.diver.rmv).toBe(unitConversion.toLiter(rmv));
            expect(component.diver.stressRmv).toBe(unitConversion.toLiter(stressRmv));
            expect(wasEmitted).toBeTrue();
        });
    });


    describe('maxPpO2Changed', () => {
        it('should change new value of maxPpO2 and emit change', () => {
            const newPpO2 = 1.2;
            let wasEmitted = false;
            component.changed.subscribe(() => wasEmitted = true);

            component.maxPpO2Changed(newPpO2);


            expect(component.diver.maxPpO2).toBe(newPpO2);
            expect(wasEmitted).toBeTrue();
        });
    });
    describe('maxDecoPpO2Changed', () => {
        it('should change new value of maxDecoPpO2 and emit change', () => {
            const newDecoPpO2 = 1.4;
            let wasEmitted = false;
            component.changed.subscribe(() => wasEmitted = true);

            component.maxDecoPpO2Changed(newDecoPpO2);
            expect(component.diver.maxDecoPpO2).toBe(newDecoPpO2);
            expect(wasEmitted).toBeTrue();
        })
    })
});
