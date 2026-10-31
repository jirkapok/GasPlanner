import { describe, beforeEach, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DiffTabsButtonComponent } from './diff-tabs-button.component';
import { ProfileComparatorService } from '../../../shared/diff/profileComparatorService';
import { DiveSchedules } from '../../../shared/dive.schedules';
import { UnitConversion } from '../../../shared/UnitConversion';
import { ReloadDispatcher } from '../../../shared/reloadDispatcher';
import { provideTestTranslate } from '../../../../testing/translate-testing.helpers';

class DiffTabsButtonPage {
    constructor(private fixture: ComponentFixture<DiffTabsButtonComponent>) {}

    public get profileALabel(): HTMLDivElement | undefined {
        return this.fixture.debugElement.query(By.css('[data-testid="profile-a-label"]'))?.nativeElement as HTMLDivElement | undefined;
    }

    public get profileBLabel(): HTMLDivElement | undefined {
        return this.fixture.debugElement.query(By.css('[data-testid="profile-b-label"]'))?.nativeElement as HTMLDivElement | undefined;
    }

    public get selectButton(): HTMLButtonElement {
        return this.fixture.debugElement.query(By.css('[data-testid="select-button"]'))?.nativeElement as HTMLButtonElement;
    }
}

describe('DiffTabsButtonComponent', () => {
    let fixture: ComponentFixture<DiffTabsButtonComponent>;
    let diff: ProfileComparatorService;
    let page: DiffTabsButtonPage;
    let schedules: DiveSchedules;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [DiffTabsButtonComponent],
            providers: [
                ProfileComparatorService,
                DiveSchedules,
                UnitConversion,
                ReloadDispatcher,
                provideTestTranslate()
            ]
        });
        schedules = TestBed.inject(DiveSchedules);
        schedules.add();
        schedules.add();

        diff = TestBed.inject(ProfileComparatorService);
        diff.selectProfile(0);
        diff.selectProfile(2);

        fixture = TestBed.createComponent(DiffTabsButtonComponent);
        page = new DiffTabsButtonPage(fixture);

        // There are three dives in these tests
        // Test component handles the second one (not selected in the beginning)
        fixture.componentRef.setInput('index', 1);
        fixture.detectChanges();
    });

    it('detects when dive is primary', () => {
        diff.selectProfile(1);
        diff.selectProfile(0);
        fixture.detectChanges();

        expect(page.profileALabel).toBeTruthy();
    });

    it('detects when dive is secondary', () => {
        diff.selectProfile(1);
        fixture.detectChanges();

        expect(page.profileBLabel).toBeTruthy();
    });

    it('detects when dive is not selected', () => {
        fixture.detectChanges();

        expect(page.profileALabel || page.profileBLabel).not.toBeTruthy();
    });

    it('selects dive', () => {
        page.selectButton.click();
        fixture.detectChanges();

        expect(page.profileBLabel).toBeTruthy();
    });
});
