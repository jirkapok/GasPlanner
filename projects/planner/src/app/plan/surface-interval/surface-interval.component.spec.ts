import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecimalPipe } from '@angular/common';
import { SurfaceIntervalComponent } from './surface-interval.component';
import { DiveSchedules } from '../../shared/dive.schedules';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { InputControls } from '../../shared/inputcontrols';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';
import { planTestProviders } from '../../../testing/plan.testing';

describe('SurfaceIntervalComponent', () => {
    let component: SurfaceIntervalComponent;
    let fixture: ComponentFixture<SurfaceIntervalComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ SurfaceIntervalComponent ],
            providers: [
                DiveSchedules, UnitConversion, DecimalPipe,
                ReloadDispatcher, InputControls, ValidatorGroups,
                provideTestTranslate()
            ]
        });
        fixture = TestBed.createComponent(SurfaceIntervalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

describe('SurfaceIntervalComponent OnPush', () => {
    it('renders editable surface interval of the dive selected outside the component', async () => {
        TestBed.configureTestingModule({
            imports: [SurfaceIntervalComponent],
            providers: planTestProviders
        });
        const fixture = await renderOnPush(SurfaceIntervalComponent);
        const input = (): HTMLInputElement | null => (fixture.nativeElement as HTMLElement).querySelector('input');
        expect(input()?.readOnly).toBe(true);
        const schedules = TestBed.inject(DiveSchedules);
        const second = schedules.add();
        second.surfaceInterval = 3600;

        schedules.selected = second;
        await fixture.whenStable();

        expect(input()?.readOnly).toBe(false);
    });
});
