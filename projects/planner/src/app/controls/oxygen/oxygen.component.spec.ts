import { TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { OxygenComponent } from './oxygen.component';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { UnitConversion } from '../../shared/UnitConversion';
import { OptionsService } from '../../shared/options.service';
import { LanguageService } from '../../shared/language.service';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';

describe('OxygenComponent OnPush', () => {
    it('renders hidden gas label after parent patched invalid oxygen outside Angular events', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideTestTranslate(), LanguageService, InputControls, DecimalPipe,
                ValidatorGroups, UnitConversion, OptionsService
            ],
            imports: [RouterTestingModule.withRoutes([])]
        });
        const fixture = await renderOnPush(OxygenComponent);
        const label = (): Element | null => (fixture.nativeElement as HTMLElement).querySelector('app-gaslabel');
        expect(label()?.classList).not.toContain('invisible');
        const control = fixture.componentInstance.nitroxForm.get('o2');

        control?.markAsDirty();
        control?.setValue(-1000);
        await fixture.whenStable();

        expect(label()?.classList).toContain('invisible');
    });
});
