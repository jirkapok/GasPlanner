import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';

import { DiveIssuesComponent } from './dive-issues.component';
import { UnitConversion } from '../../shared/UnitConversion';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { DiveSchedules } from '../../shared/dive.schedules';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { LanguageService } from '../../shared/language.service';
import { BoundEvent } from '../../shared/models';
import { EventsFactory, Time } from 'scuba-physics';

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
        vi.spyOn(component.dive, 'events', 'get').mockReturnValue([highPpO2]);
        fixture.componentRef.changeDetectorRef.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelectorAll('.alert-danger').length).toBe(1);
        expect(element.querySelectorAll('.alert-warning').length).toBe(0);
        expect(highPpO2.isError).toBe(true);
    });
});
