import { TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { GradientsComponent } from './gradients.component';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { UnitConversion } from '../../shared/UnitConversion';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';

describe('GradientsComponent OnPush', () => {
    it('renders invalid state after parent patched form outside Angular events', async () => {
        TestBed.configureTestingModule({
            providers: [provideTestTranslate(), InputControls, DecimalPipe, ValidatorGroups, UnitConversion]
        });
        const fixture = await renderOnPush(GradientsComponent);
        const control = fixture.componentInstance.gfForm.get('gfLow');

        control?.markAsDirty();
        control?.setValue(-1000);
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).querySelector('.is-invalid')).not.toBeNull();
    });
});
