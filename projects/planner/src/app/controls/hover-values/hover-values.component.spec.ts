import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DatePipe } from '@angular/common';
import { HoverValuesComponent } from './hover-values.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ProfileHoverValues } from '../../shared/profileHoverValues';
import { HoverColors } from '../../shared/chartPlotter';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

describe('HoverValuesComponent', () => {
    let fixture: ComponentFixture<HoverValuesComponent>;

    const colors: HoverColors = {
        depth: 'rgb(18, 145, 59)',
        averageDepth: 'rgb(105, 181, 120)',
        ceiling: 'rgb(252, 175, 103)',
        emergency: 'rgb(255, 77, 77)',
        event: 'rgb(0, 150, 60)'
    };

    const hovered = (): ProfileHoverValues => {
        const values = new ProfileHoverValues();
        values.timeStamp = 1740;
        values.depth = 21;
        values.averageDepth = 25.6;
        values.ceiling = 5;
        values.events = ['Safety stop'];
        return values;
    };

    const text = (): string => (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';

    const samples = (): CSSStyleDeclaration[] => fixture.debugElement.queryAll(By.css('.hover-marker'))
        .map(m => getComputedStyle(m.nativeElement as HTMLElement));

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [HoverValuesComponent],
            providers: [UnitConversion, DatePipe, provideTestTranslate()]
        });

        fixture = TestBed.createComponent(HoverValuesComponent);
        fixture.componentRef.setInput('colors', colors);
        await fixture.whenStable();
    });

    const show = async (values: ProfileHoverValues | undefined, inputs: Record<string, unknown> = {}): Promise<void> => {
        fixture.componentRef.setInput('values', values);
        Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
        await fixture.whenStable();
    };

    it('reserves empty line when nothing is hovered', async () => {
        await show(undefined);

        expect(text()).toBe('');
        expect((fixture.nativeElement as HTMLElement).getBoundingClientRect().height).toBeGreaterThan(0);
    });

    it('shows time and values with units', async () => {
        await show(hovered());

        expect(text()).toContain('29:00');
        expect(text()).toContain('profileChart.depthTraceName');
        expect(text()).toContain('21 m');
        expect(text()).toContain('25.6 m');
        expect(text()).toContain('5 m');
        expect(text()).toContain('Safety stop');
    });

    it('hides time when not requested', async () => {
        await show(hovered(), { showTime: false });

        expect(text()).not.toContain('29:00');
    });

    it('shows profile name in front of values', async () => {
        await show(hovered(), { showTime: false, labelKey: 'diffResultsTable.profileA' });

        expect(text().startsWith('diffResultsTable.profileA')).toBe(true);
    });

    it('draws line samples and values in given colors', async () => {
        await show(hovered());

        expect(samples().map(s => s.borderTopColor).slice(0, 3)).toEqual([colors.depth, colors.averageDepth, colors.ceiling]);
        expect(samples()[3].backgroundColor).toBe(colors.event);
        const value = fixture.debugElement.query(By.css('.hover-value')).nativeElement as HTMLElement;
        expect(getComputedStyle(value).color).toBe(colors.depth);
    });

    // ceiling is filled area in the chart
    it('fills ceiling sample with semi transparent line color', async () => {
        await show(hovered());

        const fill = samples()[2].backgroundColor;
        expect(fill).not.toBe('rgba(0, 0, 0, 0)');
        expect(fill).not.toBe(colors.ceiling);
    });
});
