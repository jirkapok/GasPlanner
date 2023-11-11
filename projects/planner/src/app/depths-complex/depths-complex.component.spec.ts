import { DecimalPipe } from '@angular/common';
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DepthsService } from '../shared/depths.service';
import { InputControls } from '../shared/inputcontrols';
import { OptionsService } from '../shared/options.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthsComplexComponent } from './depths-complex.component';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { TanksService } from '../shared/tanks.service';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { WayPointsService } from '../shared/waypoints.service';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { DiveResults } from '../shared/diveresults';

export class ComplexDepthsPage {
    constructor(private fixture: ComponentFixture<DepthsComplexComponent>) { }

    public get addLevelButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#addLevel')).nativeElement as HTMLButtonElement;
    }

    public debugElement(id: string): HTMLInputElement {
        const found = this.fixture.debugElement.query(By.css(id));
        return found.nativeElement as HTMLInputElement;
    }

    public removeLevelButton(index: number): HTMLButtonElement {
        const id = `#removeLevel-${index}`;
        const debugElement = this.fixture.debugElement.query(By.css(id));
        return debugElement.nativeElement as HTMLButtonElement;
    }

    public durationInput(index: number): HTMLInputElement {
        const id = `#durationItem-${index}`;
        return this.debugElement(id);
    }

    public depthInput(index: number): HTMLInputElement {
        const id = `#depthItem-${index}`;
        return this.debugElement(id);
    }

    public removeButtons(): number {
        const id = '[id^="removeLevel"]';
        const found = this.fixture.debugElement.queryAll(By.css(id));
        return found.length;
    }
}

describe('Depths Complex Component', () => {
    let component: DepthsComplexComponent;
    let depths: DepthsService;
    let fixture: ComponentFixture<DepthsComplexComponent>;
    let complexPage: ComplexDepthsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthsComplexComponent],
            imports: [ReactiveFormsModule],
            providers: [WorkersFactoryCommon, PlannerService,
                UnitConversion, InputControls, DelayedScheduleService,
                OptionsService, ValidatorGroups,
                DepthsService, DecimalPipe, TanksService,
                ViewSwitchService, WayPointsService,
                SubViewStorage, ViewStates, PreferencesStore, Preferences,
                DiveResults
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsComplexComponent);
        component = fixture.componentInstance;
        depths = component.depths;
        const planner = TestBed.inject(PlannerService);
        planner.calculate();
        fixture.detectChanges();
        complexPage = new ComplexDepthsPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        spyOn(scheduler, 'schedule')
            .and.callFake(() => {
                planner.calculate();
            });
    });

    it('Switch to simple view', () => {
        fixture.detectChanges();
        complexPage.durationInput(1).value = '20';
        complexPage.durationInput(1).dispatchEvent(new Event('input'));

        expect(depths.planDuration).toBe(21.7);
    });

    it('Change depth calculates profile correctly', inject([DiveResults],
        (dive: DiveResults) => {
            let eventFired = false;
            component.depths.changed$.subscribe(() => eventFired = true );
            complexPage.durationInput(1).value = '5';
            complexPage.durationInput(1).dispatchEvent(new Event('input'));
            // in case of wrong binding, the algorithm ads segment with 0 duration
            expect(eventFired).toBeTruthy();
        }));

    describe('Levels enforce calculation', () => {
        it('Adds level to end of profile segments', () => {
            complexPage.addLevelButton.click();

            fixture.detectChanges();
            expect(depths.levels.length).toBe(3);
            expect(complexPage.removeButtons()).toBe(3);
        });

        it('Is removed from correct position', () => {
            complexPage.removeLevelButton(1).click();
            fixture.detectChanges();
            expect(depths.levels.length).toBe(1);
            expect(complexPage.removeButtons()).toBe(0);
        });
    });

    describe('Invalid form prevents calculation after', () => {
        it('wrong level enddepth', () => {
            const durationSpy = spyOn(depths, 'levelChanged')
                .and.callThrough();

            complexPage.durationInput(1).value = 'aaa';
            complexPage.durationInput(1).dispatchEvent(new Event('input'));
            expect(durationSpy).not.toHaveBeenCalled();
        });

        it('wrong level duration', () => {
            const durationSpy = spyOn(depths, 'levelChanged')
                .and.callThrough();

            complexPage.depthInput(1).value = 'aaa';
            complexPage.depthInput(1).dispatchEvent(new Event('input'));
            expect(durationSpy).not.toHaveBeenCalled();
        });
    });
});
