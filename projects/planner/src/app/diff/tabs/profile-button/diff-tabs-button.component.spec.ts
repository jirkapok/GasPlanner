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
    let component: DiffTabsButtonComponent;
    let fixture: ComponentFixture<DiffTabsButtonComponent>;
    let diff: ProfileComparatorService;
    let page: DiffTabsButtonPage;

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
        fixture = TestBed.createComponent(DiffTabsButtonComponent);
        page = new DiffTabsButtonPage(fixture);
        component = fixture.componentInstance;
        fixture.detectChanges();
        diff = TestBed.inject(ProfileComparatorService);
    });

    it('creates', () => {
        expect(component).toBeTruthy();
    });

    it('selects dive', () => {
        fixture.componentRef.setInput('index', 1);
        fixture.detectChanges();

        page.selectButton.click();
        fixture.detectChanges();

        expect(page.profileBLabel).toBeTruthy();
    });
});
