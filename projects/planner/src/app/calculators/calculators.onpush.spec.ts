import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AltitudeCalcComponent } from './altitude-calc/altitude-calc.component';
import { GasBlenderComponent } from './gas-blender/gas-blender.component';
import { GasPropertiesCalcComponent } from './gas.props/gas.props.component';
import { NdlLimitsComponent } from './ndl-limits/ndl-limits.component';
import { NitroxComponent } from './nitrox/nitrox.component';
import { RedundanciesComponent } from './redundancies/redundancies.component';
import { SacComponent } from './sac/sac.component';
import { WeightCalcComponent } from './weight/weight.component';
import { NdlService } from '../shared/ndl.service';
import { GasBlenderService } from '../shared/gas-blender.service';
import { BlendPricingService } from '../shared/blend-pricing.service';
import { NitroxCalculatorService } from '../shared/nitrox-calculator.service';
import { SacCalculatorService } from '../shared/sac-calculator.service';
import { planTestProviders } from '../../testing/plan.testing';
import { renderOnPush } from '../../testing/onPush.testing';

const configure = (): void => {
    TestBed.configureTestingModule({
        providers: [
            ...planTestProviders, provideRouter([]),
            NdlService, GasBlenderService, BlendPricingService,
            NitroxCalculatorService, SacCalculatorService
        ]
    });
};

/** Everything shown except the edited input, which shows the typed value even without change detection */
const rendered = (fixture: ComponentFixture<unknown>, edited: HTMLInputElement): string => {
    const element = fixture.nativeElement as HTMLElement;
    const values = Array.from(element.querySelectorAll('input'))
        .filter(i => i !== edited)
        .map(i => i.value);
    return `${element.textContent}|${values.join('|')}`;
};

interface CalculatorCase {
    name: string;
    component: Type<unknown>;
    /** the first editable number input with value increased by one, if not specified */
    input?: { selector: string; value: string };
}

const calculators: CalculatorCase[] = [
    { name: 'altitude', component: AltitudeCalcComponent, input: { selector: '#pressure', value: '0.9' } },
    { name: 'gas blender', component: GasBlenderComponent, input: { selector: '#sourcePressure', value: '50' } },
    { name: 'gas properties', component: GasPropertiesCalcComponent },
    { name: 'ndl limits', component: NdlLimitsComponent },
    { name: 'nitrox', component: NitroxComponent },
    { name: 'redundancies', component: RedundanciesComponent },
    { name: 'sac', component: SacComponent },
    { name: 'weight', component: WeightCalcComponent, input: { selector: '#consumed', value: '150' } }
];

describe('Calculators OnPush', () => {
    calculators.forEach(({ name, component, input: changed }) => {
        it(`renders ${name} result after input changed`, async () => {
            configure();
            const fixture = await renderOnPush(component);
            const element = fixture.nativeElement as HTMLElement;
            const selector = changed?.selector ?? 'input[type="number"]:not([readonly]):not([disabled])';
            const input = element.querySelector<HTMLInputElement>(selector);
            expect(input).not.toBeNull();
            const edited = input as HTMLInputElement;
            const before = rendered(fixture, edited);

            edited.value = changed?.value ?? String(Number(edited.value) + 1);
            edited.dispatchEvent(new Event('input'));
            await fixture.whenStable();

            expect(rendered(fixture, edited)).not.toEqual(before);
        });
    });

    it('renders gas label of maximum ppO2 changed in ndl limits', async () => {
        configure();
        const fixture = await renderOnPush(NdlLimitsComponent);
        const element = fixture.nativeElement as HTMLElement;
        const label = (): string | null | undefined => element.querySelector('app-gaslabel')?.textContent;
        const before = label();
        const ppO2 = element.querySelector<HTMLInputElement>('app-pp-o2 input') as HTMLInputElement;

        ppO2.value = '1.6';
        ppO2.dispatchEvent(new Event('input'));
        await fixture.whenStable();

        expect(label()).not.toEqual(before);
    });
});
