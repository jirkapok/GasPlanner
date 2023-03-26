import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
import { Plan } from '../shared/plan.service';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';

export class ComplexDepthsPage {
    constructor(private fixture: ComponentFixture<DepthsComplexComponent>) { }

    public get addLevelButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#addLevel')).nativeElement as HTMLButtonElement;
    }

    public get durationDebugs(): DebugElement[] {
        const all = this.fixture.debugElement.queryAll(By.css('#durationItem'));
        return all;
    }

    public removeLevelButton(index: number): HTMLButtonElement {
        const all = this.fixture.debugElement.queryAll(By.css('#removeLevel'));
        return all[index].nativeElement as HTMLButtonElement;
    }

    public durationInput(index: number): HTMLInputElement {
        return this.durationDebugs[index].nativeElement as HTMLInputElement;
    }

    public depthInput(index: number): HTMLInputElement {
        const all = this.fixture.debugElement.queryAll(By.css('#depthItem'));
        return all[index].nativeElement as HTMLInputElement;
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
                ViewSwitchService, Plan
            ]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsComplexComponent);
        component = fixture.componentInstance;
        depths = component.depths;
        component.planner.calculate();
        fixture.detectChanges();
        complexPage = new ComplexDepthsPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        spyOn(scheduler, 'schedule')
            .and.callFake(() => {
                component.planner.calculate();
            });
    });

    it('Switch to simple view', () => {
        fixture.detectChanges();
        complexPage.durationInput(1).value = '20';
        complexPage.durationInput(1).dispatchEvent(new Event('input'));

        expect(depths.planDuration).toBe(21.7);
    });

    it('Change depth calculates profile correctly', () => {
        complexPage.durationInput(1).value = '5';
        complexPage.durationInput(1).dispatchEvent(new Event('input'));
        // in case of wrong binding, the algorithm ads segment with 0 duration
        expect(component.planner.dive.totalDuration).toBe(882);
    });

    describe('Levels enforce calculation', () => {
        it('Adds level to end of profile segments', () => {
            complexPage.addLevelButton.click();
            fixture.detectChanges();
            expect(depths.levels.length).toBe(3);
            expect(complexPage.durationDebugs.length).toBe(3);
        });

        it('Is removed from correct position', () => {
            complexPage.removeLevelButton(1).click();
            fixture.detectChanges();
            expect(depths.levels.length).toBe(1);
            expect(complexPage.durationDebugs.length).toBe(1);
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
