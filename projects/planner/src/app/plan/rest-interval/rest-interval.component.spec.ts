import { beforeEach, describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { RestIntervalComponent } from './rest-interval.component';
import { ValidatorGroups } from '../../shared/ValidatorGroups';
import { UnitConversion } from '../../shared/UnitConversion';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';

@Component({
    imports: [RestIntervalComponent],
    template: '<app-rest-interval [(restInterval)]="value" />'
})
class RestIntervalHostComponent {
    public readonly value = signal(0);
}

class RestIntervalPage {
    constructor(private fixture: ComponentFixture<RestIntervalHostComponent>) {}

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

    public async openDropdown(): Promise<void> {
        const toggle = this.fixture.debugElement.query(By.css('[data-testid="dropdown-button"]'))
            .nativeElement as HTMLButtonElement;

        toggle.click();
        this.fixture.detectChanges();
        await this.fixture.whenStable();
        this.fixture.detectChanges();
    }
}

describe('RestIntervalComponent', () => {
    let fixture: ComponentFixture<RestIntervalHostComponent>;
    let host: RestIntervalHostComponent;
    let page: RestIntervalPage;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            imports: [RestIntervalHostComponent],
            providers: [
                ValidatorGroups,
                UnitConversion,
                provideTestTranslate(),
                provideNoopAnimations()  // MDB uses @fade.done, so we need to provide this
            ]
        });

        fixture = TestBed.createComponent(RestIntervalHostComponent);
        host = fixture.componentInstance;
        page = new RestIntervalPage(fixture);
        await fixture.whenStable();
    });

    const stabilize = async (): Promise<void> => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    const enterInterval = async (value: string): Promise<void> => {
        page.durationInput.value = value;
        page.durationInput.dispatchEvent(new Event('input'));
        await stabilize();
    };

    const applyPreset = async (item: () => HTMLLIElement): Promise<void> => {
        await page.openDropdown();
        item().click();
        await stabilize();
    };

    it('shows bound value formatted', async () => {
        host.value.set(5400);
        await stabilize();

        expect(page.durationInput.value).toBe('01:30');
    });

    it('writes valid input to bound value', async () => {
        await enterInterval('01:15');

        expect(host.value()).toBe(4500);
    });

    it('applies 0 minutes', async () => {
        host.value.set(1800);
        await stabilize();

        await applyPreset(() => page.zeroMinutesItem);

        expect(host.value()).toBe(0);
        expect(page.durationInput.value).toBe('00:00');
    });

    it('applies 30 minutes', async () => {
        await applyPreset(() => page.thirtyMinutesItem);

        expect(host.value()).toBe(1800);
        expect(page.durationInput.value).toBe('00:30');
    });

    it('applies 1 hour', async () => {
        await applyPreset(() => page.oneHourItem);

        expect(host.value()).toBe(3600);
        expect(page.durationInput.value).toBe('01:00');
    });

    it('applies 2 hours', async () => {
        await applyPreset(() => page.twoHoursItem);

        expect(host.value()).toBe(7200);
        expect(page.durationInput.value).toBe('02:00');
    });

    it('accepts exactly 24 hours', async () => {
        await enterInterval('24:00');

        expect(page.errorMessage).toBeNull();
        expect(host.value()).toBe(86400);
    });

    it('does not change bound value for invalid input', async () => {
        host.value.set(1800);
        await stabilize();

        await enterInterval('24:01');

        expect(page.errorMessage).not.toBeNull();
        expect(host.value()).toBe(1800);
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
