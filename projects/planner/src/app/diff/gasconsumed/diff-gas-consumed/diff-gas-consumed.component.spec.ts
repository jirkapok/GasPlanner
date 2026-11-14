import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GasConsumedDifferenceComponent } from './diff-gas-consumed.component';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { DiveSchedules } from '../../../shared/dive.schedules';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ReloadDispatcher } from '../../../shared/reloadDispatcher';
import { GasesComparisonService } from '../../../shared/diff/gases-comparison.service';
import { provideTestTranslate } from '../../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../../testing/onPush.testing';
import { compareTwoCalculatedDives, diffTestProviders, swapComparedProfiles } from '../../../../testing/diff.testing';

describe('DiffGasConsumedComponent', () => {
    let component: GasConsumedDifferenceComponent;
    let fixture: ComponentFixture<GasConsumedDifferenceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GasConsumedDifferenceComponent],
            providers: [
                GasesComparisonService,
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher,
                provideTestTranslate()
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(GasConsumedDifferenceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

describe('DiffGasConsumedComponent OnPush', () => {
    let fixture: ComponentFixture<GasConsumedDifferenceComponent>;

    const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [GasConsumedDifferenceComponent],
            providers: diffTestProviders
        });
        fixture = await renderOnPush(GasConsumedDifferenceComponent);
        compareTwoCalculatedDives();
        await fixture.whenStable();
    });

    it('renders consumption calculated outside Angular events', () => {
        expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-diff-gas-consumed-tank-chart').length).toBe(1);
    });

    it('renders consumption of profiles swapped outside Angular events', async () => {
        const before = text();

        swapComparedProfiles();
        await fixture.whenStable();

        expect(text()).not.toEqual(before);
    });
});
