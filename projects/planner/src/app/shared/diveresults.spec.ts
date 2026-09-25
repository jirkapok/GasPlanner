import { HighestDensity } from 'scuba-physics';
import { DiveResults } from './diveresults';

describe('DiveResults', () => {
    let sut: DiveResults;

    const updateCns = (cns: number, dailyCns: number): void => {
        sut.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, cns, HighestDensity.createDefault(), [], [], [], dailyCns, []);
    };

    beforeEach(() => {
        sut = new DiveResults();
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
            sut.updateDiveInfo(0, false, 0, 0, 0, 0, 0, 0, 50, HighestDensity.createDefault(), [], [], []);
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
