import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';

import { DiveIssuesComponent } from './dive-issues.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';
import { BoundEvent } from '../../shared/models';
import { EventsFactory, HighestDensity, StandardGases, Time } from 'scuba-physics';
import { renderOnPush } from '../../../testing/onPush.testing';

describe('DiveIssuesComponent', () => {
    let component: DiveIssuesComponent;
    let fixture: ComponentFixture<DiveIssuesComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiveIssuesComponent],
            providers: [
                UnitConversion, DiveSchedules,
                ReloadDispatcher, provideTestTranslate(), LanguageService,
                DatePipe
            ]
        });
        fixture = TestBed.createComponent(DiveIssuesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows high ppO2 as error', () => {
        const units = TestBed.inject(UnitConversion);
        const highPpO2 = new BoundEvent(units, EventsFactory.createHighPpO2(Time.oneMinute, 30));
        component.dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [highPpO2], 0, [], []);
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelectorAll('.alert-danger').length).toBe(1);
        expect(element.querySelectorAll('.alert-warning').length).toBe(0);
        expect(highPpO2.isError).toBe(true);
    });

    it('shows loop ppO2 out of range as error', () => {
        const units = TestBed.inject(UnitConversion);
        const outOfRange = new BoundEvent(units, EventsFactory.createPpO2OutOfRange(Time.oneMinute, 70, 1.6895));
        component.dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [outOfRange], 0, [], []);
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const alert = element.querySelector('.alert-danger #loopPpO2OutOfRange');
        expect(alert?.textContent).toContain('diveIssues.loopPpO2OutOfRange');
        expect(outOfRange.isError).toBe(true);
        expect(outOfRange.ppO2).toBe(1.69);
    });

    it('allowed loop ppO2 range comes from the selected dive options', () => {
        expect(component.minPpO2).toBe(0.18);
        expect(component.maxPpO2).toBe(1.4);
        expect(component.maxDecoPpO2).toBe(1.6);
    });

    it('shows nitrogen over the limit for isobaric counter diffusion', () => {
        const units = TestBed.inject(UnitConversion);
        const icd = new BoundEvent(units, EventsFactory.createIsobaricCounterDiffusion(Time.oneMinute, 21, StandardGases.ean50, 0.04));
        component.dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [icd], 0, [], []);
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const overLimit = element.querySelector('.alert-warning #icdOverLimit');
        expect(overLimit?.textContent).toContain('diveIssues.highN2SwitchOverLimit');
        expect(icd.n2OverLimit).toBe(4);
    });
});

describe('DiveIssuesComponent OnPush', () => {
    let fixture: ComponentFixture<DiveIssuesComponent>;
    const units = new UnitConversion();

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [DiveIssuesComponent],
            providers: [
                { provide: UnitConversion, useValue: units }, DiveSchedules,
                ReloadDispatcher, provideTestTranslate(), LanguageService,
                DatePipe
            ]
        });
        fixture = await renderOnPush(DiveIssuesComponent);
    });

    it('renders events changed outside Angular events', async () => {
        const highPpO2 = new BoundEvent(units, EventsFactory.createHighPpO2(Time.oneMinute, 30));
        const dive = TestBed.inject(DiveSchedules).selected.diveResult;
        dive.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [highPpO2], 0, [], []);
        await fixture.whenStable();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelectorAll('.alert-danger').length).toBe(1);
    });
});
