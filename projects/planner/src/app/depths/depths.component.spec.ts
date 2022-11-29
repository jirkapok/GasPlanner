import { DecimalPipe } from '@angular/common';
import { DebugElement } from '@angular/core';
import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { Tank } from 'scuba-physics';
import { DelayedScheduleService } from '../shared/delayedSchedule.service';
import { DepthsService } from '../shared/depths.service';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { UnitConversion } from '../shared/UnitConversion';
import { DepthsComponent } from './depths.component';

export class SimpleDepthsPage {
    constructor(private fixture: ComponentFixture<DepthsComponent>) { }

    public get durationInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('#duration')).nativeElement as HTMLInputElement;
    }

    public get applyMaxDurationButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#btnApplyDuration')).nativeElement as HTMLButtonElement;
    }

    public get applyNdlButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('#btnApplyNdl')).nativeElement as HTMLButtonElement;
    }
}

export class ComplexDepthsPage {
    constructor(private fixture: ComponentFixture<DepthsComponent>) { }

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

describe('DepthsComponent', () => {
    let component: DepthsComponent;
    let depths: DepthsService;
    let fixture: ComponentFixture<DepthsComponent>;
    let simplePage: SimpleDepthsPage;
    let complexPage: ComplexDepthsPage;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DepthsComponent],
            imports: [ReactiveFormsModule],
            providers: [WorkersFactoryCommon, PlannerService,
                UnitConversion, DecimalPipe, DelayedScheduleService]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(DepthsComponent);
        component = fixture.componentInstance;
        depths = component.depths;
        component.planner.calculate();
        fixture.detectChanges();
        simplePage = new SimpleDepthsPage(fixture);
        complexPage = new ComplexDepthsPage(fixture);
        const scheduler = TestBed.inject(DelayedScheduleService);
        const schedulerSpy = spyOn(scheduler, 'schedule')
            .and.callFake(() => {
                component.planner.calculate();
            });
    });

    it('Duration change enforces calculation', () => {
        simplePage.durationInput.value = '20';
        simplePage.durationInput.dispatchEvent(new Event('input'));
        expect(depths.planDuration).toBe(20);
    });

    describe('Simple view', () => {
        describe('Duration reloaded enforced by', () => {
            it('Apply max NDL', () => {
                simplePage.applyNdlButton.click();
                expect(simplePage.durationInput.value).toBe('13');
            });

            it('Apply max duration', () => {
                simplePage.applyMaxDurationButton.click();
                expect(simplePage.durationInput.value).toBe('19');
            });

            it('Switch to simple view', () => {
                component.planner.isComplex = true;
                fixture.detectChanges();
                complexPage.durationInput(1).value = '20';
                complexPage.durationInput(1).dispatchEvent(new Event('input'));
                expect(depths.planDuration).toBe(21.7);
            });
        });

        it('wrong duration doesn\'t call calculate', () => {
            const durationSpy = spyOnProperty(depths, 'planDuration')
                .and.callThrough();

            simplePage.durationInput.value = 'aaa';
            simplePage.durationInput.dispatchEvent(new Event('input'));
            expect(durationSpy).not.toHaveBeenCalled();
        });
    });


    describe('Complex view', () => {
        beforeEach(() => {
            component.planner.isComplex = true;
            fixture.detectChanges();
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

    describe('Max narcotic depth', () => {
        it('Is calculated 30 m for Air with 30m max. narcotic depth option', inject([PlannerService],
            (planner: PlannerService) => {
                depths.applyMaxDepth();
                expect(planner.plan.maxDepth).toBe(30);
            }));

        it('Max narcotic depth is applied', inject([PlannerService],
            (planner: PlannerService) => {
                planner.firstTank.o2 = 50;
                depths.applyMaxDepth();
                expect(planner.plan.maxDepth).toBe(18);
            }));
    });

    describe('Imperial Units', () => {
        beforeEach(() => {
            component.units.imperialUnits = true;
        });

        it('Updates end depth', () => {
            const last = depths.levels[1];
            last.endDepth = 70;
            const result = last.segment.endDepth;
            expect(result).toBeCloseTo(21.336, 6);
        });

        it('Converts start depth', () => {
            const last = depths.levels[1];
            last.segment.startDepth = 6.096;
            expect(last.startDepth).toBeCloseTo(20, 6);
        });

        it('Adjusts tank label', () => {
            const last = depths.levels[1];
            const tank: Tank = last.tank || new Tank(0, 0, 0);
            tank.startPressure = component.units.toBar(3000);
            tank.size = component.units.toTankLiters(100);
            expect(last.tankLabel).toBe('1. Air/100/3000');
        });
    });
});
