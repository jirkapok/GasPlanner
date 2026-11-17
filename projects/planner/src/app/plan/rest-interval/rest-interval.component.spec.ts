import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { provideNoopAnimations } from "@angular/platform-browser/animations";
import { RestIntervalComponent } from "./rest-interval.component";
import { DiveSchedules } from "../../shared/dive.schedules";
import { DateFormats } from "../../shared/formaters";
import { ReloadDispatcher } from "../../shared/reloadDispatcher";
import { ValidatorGroups } from "../../shared/ValidatorGroups";
import { provideTestTranslate } from "../../../testing/translate-testing.helpers";
import { UnitConversion } from "../../shared/UnitConversion";

class RestIntervalPage {
    constructor(private fixture: ComponentFixture<RestIntervalComponent>) {}

    public async openDropdown(): Promise<void> {
        const toggle = this.fixture.debugElement.query(By.css('[data-testid="dropdown-button"]'))
            .nativeElement as HTMLButtonElement;

        toggle.click();
        this.fixture.detectChanges();
        await this.fixture.whenStable();
        this.fixture.detectChanges();
    }

    public get durationInput(): HTMLInputElement {
        return this.fixture.debugElement.query(By.css('[data-testid="interval-input"]'))
            .nativeElement as HTMLInputElement;
    }

    public get zeroMinutesItem(): HTMLLIElement {
        return this.fixture.debugElement.query(By.css('[data-testid="0-minutes"]'))
            .nativeElement as HTMLLIElement;
    }

    public get thirtyMinutesItem(): HTMLLIElement {
        return this.fixture.debugElement.query(By.css('[data-testid="30-minutes"]'))
            .nativeElement as HTMLLIElement;
    }

    public get oneHourItem(): HTMLLIElement {
        return this.fixture.debugElement.query(By.css('[data-testid="1-hour"]'))
            .nativeElement as HTMLLIElement;
    }

    public get twoHoursItem(): HTMLLIElement {
        return this.fixture.debugElement.query(By.css('[data-testid="2-hours"]'))
            .nativeElement as HTMLLIElement;
    }

    // Inside @if statement
    public get errorMessage(): HTMLElement | null {
        return this.fixture.debugElement.query(By.css('[data-testid="error-message"]'))
            ?.nativeElement as HTMLElement | undefined ?? null;
    }
}

describe('RestIntervalComponent', () => {
    let fixture: ComponentFixture<RestIntervalComponent>;
    let page: RestIntervalPage;
    let schedules: DiveSchedules;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RestIntervalComponent],
            providers: [
                UnitConversion,
                DiveSchedules,
                ReloadDispatcher,
                ValidatorGroups,
                provideTestTranslate(),
                provideNoopAnimations()  // MDB uses @fade.done, so we need to provide this
            ]
        });

        fixture = TestBed.createComponent(RestIntervalComponent);
        schedules = TestBed.inject(DiveSchedules);
        page = new RestIntervalPage(fixture);
        fixture.detectChanges();
    });

    async function enterInterval(value: string): Promise<void> {
        page.durationInput.value = value;
        page.durationInput.dispatchEvent(new Event('input'));
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    it('sets restInterval on the schedules service when input is valid', async () => {
        await enterInterval('01:15');

        expect(schedules.restInterval).toBe(DateFormats.parseToShortTime('01:15'));
    });

    it('applies 0 minutes', async () => {
        await page.openDropdown();
        page.zeroMinutesItem.click();
        fixture.detectChanges();

        expect(schedules.restInterval).toBe(DateFormats.parseToShortTime('00:00'));
    });

    it('applies 30 minutes', async () => {
        await page.openDropdown();
        page.thirtyMinutesItem.click();
        fixture.detectChanges();

        expect(schedules.restInterval).toBe(DateFormats.parseToShortTime('00:30'));
    });

    it('applies 1 hour', async () => {
        await page.openDropdown();
        page.oneHourItem.click();
        fixture.detectChanges();

        expect(schedules.restInterval).toBe(DateFormats.parseToShortTime('01:00'));
    });

    it('applies 2 hours', async () => {
        await page.openDropdown();
        page.twoHoursItem.click();
        fixture.detectChanges();

        expect(schedules.restInterval).toBe(DateFormats.parseToShortTime('02:00'));
    });

    it('accepts exactly 24 hours', async () => {
        await enterInterval('24:00');

        expect(page.errorMessage).toBeNull();
        expect(schedules.restInterval).toBe(DateFormats.parseToShortTime('24:00'));
    });

    it('shows an error when Maskito clears unparseable input', async () => {
        await enterInterval('abc');

        expect(page.durationInput.value).toBe('');
        expect(page.errorMessage).not.toBeNull();
    });

    it('shows an error for an interval greater than 24 hours', async () => {
        await enterInterval('24:01');

        expect(page.durationInput.value).toBe('24:01');
        expect(page.errorMessage).not.toBeNull();
    });
});
