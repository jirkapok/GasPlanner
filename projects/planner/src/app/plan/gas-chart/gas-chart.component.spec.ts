import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsumedGas, StandardGases } from 'scuba-physics';
import { GasChartComponent } from './gas-chart.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';

describe('GasChartComponent', () => {
    let component: GasChartComponent;
    let fixture: ComponentFixture<GasChartComponent>;

    const render = (total: number, consumed: number, reserve: number): void => {
        const air = StandardGases.air.copy();
        component.consumed = new ConsumedGas(air, total, consumed, reserve);
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GasChartComponent],
            providers: [UnitConversion, provideTestTranslate(), LanguageService]
        }).compileComponents();

        fixture = TestBed.createComponent(GasChartComponent);
        component = fixture.componentInstance;
    });

    describe('Metric units', () => {
        beforeEach(() => {
            render(3000, 1500, 500);
        });

        it('Shows values in liters', () => {
            expect(component.reserve).toBeCloseTo(500, 6);
            expect(component.consumedVolume).toBeCloseTo(1500, 6);
            expect(component.available).toBeCloseTo(3000, 6);
        });
    });

    describe('Bars like tank chart', () => {
        const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
        const rect = (selector: string): DOMRect => (host().querySelector(selector) as HTMLElement).getBoundingClientRect();

        it('bars contain no numbers', () => {
            render(3000, 1500, 500);
            expect(host().querySelector('.progress')?.textContent?.trim()).toBe('');
        });

        it('shows reserve, consumed and available markers in bar colors', () => {
            render(3000, 1500, 500);
            const markers = host().querySelectorAll('.legend-marker');
            expect(markers.length).toBe(3);
            expect(markers[0].classList).toContain('legend-marker-reserve');
            expect(markers[1].classList).toContain('bg-success');
            expect(markers[2].classList).toContain('legend-marker-available');
        });

        it('consumed marker and missing bar are red without reserve', () => {
            render(3000, 2800, 500);
            expect(host().querySelectorAll('.legend-marker')[1].classList).toContain('bg-danger');
            expect(host().querySelector('.missing-bar')?.classList).toContain('bg-danger');
        });

        it('required bar spans reserve and consumed from the start', () => {
            render(3000, 1500, 500); // scale 3000, required 2000
            const wrapper = rect('.combined_wrapper');
            const required = rect('.required-bar');
            expect(required.left).toBeCloseTo(wrapper.left, 0);
            expect(required.width / wrapper.width).toBeCloseTo(2000 / 3000, 2);
        });

        it('available and required bars have the full bar height', () => {
            render(3000, 1500, 500);
            const wrapper = rect('.combined_wrapper');
            expect(rect('.available-bar').height).toBeCloseTo(wrapper.height, 0);
            expect(rect('.required-bar').height).toBeCloseTo(wrapper.height, 0);
        });

        it('reserve is the orange line at reserve position spanning the frame', () => {
            render(3000, 1500, 500); // reserve at 1/6 of scale
            const frame = host().querySelector('.gas-bar') as HTMLElement;
            const frameRect = frame.getBoundingClientRect();
            const border = parseFloat(getComputedStyle(frame).borderTopWidth);
            const wrapper = rect('.combined_wrapper');
            const line = host().querySelector('.reserve-bar') as HTMLElement;
            const lineRect = line.getBoundingClientRect();
            expect(getComputedStyle(line).borderRightColor).toBe('rgb(255, 140, 0)');
            expect(getComputedStyle(line).borderRightWidth).toBe('4px');
            expect(lineRect.width / wrapper.width).toBeCloseTo(500 / 3000, 2);
            expect(lineRect.top).toBeCloseTo(frameRect.top + border, 0);
            expect(lineRect.bottom).toBeCloseTo(frameRect.bottom - border, 0);
        });

        it('paints required bar over available and line over both', () => {
            render(3000, 1500, 500);
            const wrapper = rect('.combined_wrapper');
            const y = wrapper.top + wrapper.height / 2;
            const insideRequired = document.elementFromPoint(wrapper.left + wrapper.width * 0.5, y);
            expect(insideRequired?.classList).toContain('required-bar');
            const insideAvailable = document.elementFromPoint(wrapper.left + wrapper.width * 0.9, y);
            expect(insideAvailable?.classList).toContain('available-bar');
            const line = rect('.reserve-bar');
            const onLine = document.elementFromPoint(line.right - 2, y);
            expect(onLine?.classList).toContain('reserve-bar');
        });

        describe('Not enough gas', () => {
            beforeEach(() => {
                render(3000, 2800, 500); // scale 3300, available 3000, missing 300
            });

            it('shows grey available from the start instead of required bar', () => {
                expect(host().querySelector('.required-bar')).toBeNull();
                const wrapper = rect('.combined_wrapper');
                const y = wrapper.top + wrapper.height / 2;
                const nearStart = document.elementFromPoint(wrapper.left + wrapper.width * 0.5, y);
                expect(nearStart?.classList).toContain('available-bar');
            });

            it('red missing bar continues after available to the end', () => {
                const wrapper = rect('.combined_wrapper');
                const available = rect('.available-bar');
                const missing = rect('.missing-bar');
                expect(missing.left).toBeCloseTo(available.right, 0);
                expect(missing.right).toBeCloseTo(wrapper.right, 0);
                expect(missing.height).toBeCloseTo(wrapper.height, 0);
            });
        });

        it('has no missing bar with enough gas', () => {
            render(3000, 1500, 500);
            expect(host().querySelector('.missing-bar')).toBeNull();
        });
    });

    describe('Imperial units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
            render(3000, 1500, 500);
        });

        it('Values are converted to cubic feet', () => {
            expect(component.reserve).toBeCloseTo(17.657, 3);
            expect(component.consumedVolume).toBeCloseTo(52.972, 3);
            expect(component.available).toBeCloseTo(105.944, 3);
        });
    });
});
