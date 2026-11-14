import { Component, Input } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { HighestDensity, ProfileTissues, Segment, StandardGases } from 'scuba-physics';
import { DiveResults } from './diveresults';
import { UnitConversion } from './UnitConversion';
import { WayPoint } from './wayPoint';
import { renderOnPush } from '../../testing/onPush.testing';

@Component({
    selector: 'app-results-host',
    template: '<span class="ndl">{{ results.noDecoTime }}</span>' +
        '<span class="calculated">{{ results.calculated }}</span>' +
        '<span class="failed">{{ results.failed }}</span>'
})
class ResultsHostComponent {
    @Input() public results = new DiveResults();
}

describe('DiveResults', () => {
    let sut: DiveResults;

    const updateCns = (cns: number, dailyCns: number): void => {
        sut.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, cns, HighestDensity.createDefault(), [], [], [], dailyCns, [], []);
    };

    beforeEach(() => {
        sut = new DiveResults();
    });

    describe('Emergency ascent', () => {
        beforeEach(() => {
            const segment = new Segment(0, 10, StandardGases.air, 60);
            const emergencyAscent = [WayPoint.fromSegment(new UnitConversion(), segment)];
            sut.updateConsumption(0, 0, 0, 0, 0, false, false, emergencyAscent);
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('Is removed after failed calculation', () => {
            sut.endFailed();
            expect(sut.emergencyAscent).toEqual([]);
        });

        it('Is removed when consumption is still running', () => {
            vi.useFakeTimers();
            sut.start();
            vi.advanceTimersByTime(500);
            expect(sut.emergencyAscent).toEqual([]);
        });
    });

    describe('Rendering', () => {
        let fixture: ComponentFixture<ResultsHostComponent>;

        const text = (selector: string): string | null | undefined =>
            (fixture.nativeElement as HTMLElement).querySelector(selector)?.textContent;

        const finishCalculation = (): void => {
            sut.updateProfile([], ProfileTissues.createAtSurface(0), []);
            sut.updateDiveInfo(42, false, 0, 0, 0, 0, 0, 0, 0, HighestDensity.createDefault(), [], [], [], 0, [], []);
            sut.updateConsumption(0, 0, 0, 0, 0, false, false, []);
        };

        beforeEach(async () => {
            // only the still running timer, Angular scheduler still uses real animation frames
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            fixture = await renderOnPush(ResultsHostComponent, { results: sut });
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('renders dive info changed outside Angular events', async () => {
            finishCalculation();
            await fixture.whenStable();

            expect(text('.ndl')).toBe('42');
            expect(text('.calculated')).toBe('true');
        });

        it('renders still running state after 500 ms', async () => {
            finishCalculation();
            await fixture.whenStable();

            sut.start();
            vi.advanceTimersByTime(499);
            await fixture.whenStable();
            expect(text('.calculated')).toBe('true');

            vi.advanceTimersByTime(1);
            await fixture.whenStable();
            expect(text('.calculated')).toBe('false');
            expect(text('.ndl')).toBe('0');
        });

        it('renders failed state', async () => {
            sut.endFailed();
            await fixture.whenStable();

            expect(text('.failed')).toBe('true');
        });
    });

    describe('CNS exceeded', () => {
        it('Not exceeded by default', () => {
            expect(sut.cnsExceeded).toBeFalsy();
        });

        it('Not exceeded when both CNS bellow 80 %', () => {
            updateCns(79, 79);
            expect(sut.cnsExceeded).toBeFalsy();
        });

        it('Not exceeded when CNS equals 80 %', () => {
            updateCns(80, 80);
            expect(sut.cnsExceeded).toBeFalsy();
        });

        it('Exceeded when dive CNS above 80 %', () => {
            updateCns(81, 0);
            expect(sut.cnsExceeded).toBeTruthy();
        });

        it('Exceeded when daily CNS above 80 %', () => {
            updateCns(0, 81);
            expect(sut.cnsExceeded).toBeTruthy();
        });

        it('Exceeded when both CNS above 80 %', () => {
            updateCns(120, 110);
            expect(sut.cnsExceeded).toBeTruthy();
        });

        it('Daily CNS defaults to 0 % when not provided', () => {
            sut.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 50, HighestDensity.createDefault(), [], [], [], 0, [], []);
            expect(sut.dailyCns).toBe(0);
            expect(sut.cnsExceeded).toBeFalsy();
        });

        it('Exceeded CNS is reported as warning', () => {
            updateCns(0, 81);
            expect(sut.hasWarningEvent).toBeTruthy();
        });

        it('Reset after failed calculation', () => {
            updateCns(90, 90);
            sut.endFailed();
            expect(sut.cnsExceeded).toBeFalsy();
            expect(sut.dailyCns).toBe(0);
        });
    });

    describe('CNS warning level', () => {
        it('Uses dive CNS when higher', () => {
            updateCns(90, 30);
            expect(sut.cnsWarningLevel).toBe(90);
        });

        it('Uses daily CNS when higher', () => {
            updateCns(30, 95);
            expect(sut.cnsWarningLevel).toBe(95);
        });
    });
});
