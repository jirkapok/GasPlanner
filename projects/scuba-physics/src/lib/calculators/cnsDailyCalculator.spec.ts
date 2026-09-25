import { CnsDailyCalculator, CnsDive, CnsExposure } from './cnsDailyCalculator';
import { CnsCalculator } from './cnsCalculator';
import { DepthConverter } from '../physics/depth-converter';
import { Segment } from '../depths/Segments';
import { Time } from '../physics/Time';
import { StandardGases } from '../gases/StandardGases';
import { ToxicityProfiles } from './OtuCalculator.spec';

describe('CNS daily calculator', () => {
    // simple converter: 1 bar at surface + 1 bar each 10 m
    const depthConverter = DepthConverter.simple();
    const sut = new CnsDailyCalculator(depthConverter);
    const oxygen = StandardGases.oxygen.fO2;
    const ean32 = StandardGases.ean32.fO2;

    describe('Segment', () => {
        it('0 % for ppO2 bellow 0.5', () => {
            const cns = sut.calculate(ean32, 5, 5, Time.oneHour);
            expect(cns).toBeCloseTo(0, 6);
        });

        it('0 % for zero duration', () => {
            const cns = sut.calculate(oxygen, 6, 6, 0);
            expect(cns).toBeCloseTo(0, 6);
        });

        it('100 % for 150 min at ppO2 1.6', () => {
            const cns = sut.calculate(oxygen, 6, 6, Time.oneMinute * 150);
            expect(cns).toBeCloseTo(100, 6);
        });

        it('50 % for 90 min at ppO2 1.4', () => {
            const cns = sut.calculate(oxygen, 4, 4, Time.oneMinute * 90);
            expect(cns).toBeCloseTo(50, 6);
        });

        it('Interpolates limit 225 min at ppO2 1.25', () => {
            const cns = sut.calculate(oxygen, 2.5, 2.5, Time.oneMinute * 225);
            expect(cns).toBeCloseTo(100, 6);
        });

        it('Uses 720 min limit for ppO2 between 0.5 and 0.6', () => {
            const cns = sut.calculate(ean32, 7, 7, Time.oneMinute * 72);
            expect(cns).toBeCloseTo(10, 6);
        });

        it('Uses single exposure limit above ppO2 1.6', () => {
            const cns = sut.calculate(oxygen, 7, 7, Time.oneMinute * 10);
            const expected = new CnsCalculator(depthConverter).calculate(oxygen, 7, 7, Time.oneMinute * 10);
            expect(cns).toBeCloseTo(expected, 6);
            expect(cns).toBeCloseTo(56.8998578, 6);
        });

        it('Uses average depth for ascent', () => {
            const cns = sut.calculate(oxygen, 8, 4, Time.oneMinute * 75);
            expect(cns).toBeCloseTo(50, 6);
        });

        it('Profile exposure per segment', () => {
            const profile = [
                new Segment(0, 6, StandardGases.oxygen, Time.oneMinute),
                new Segment(6, 6, StandardGases.oxygen, Time.oneMinute * 30)
            ];
            const exposures = sut.exposuresForProfile(profile);
            expect(exposures.length).toBe(2);
            expect(exposures[1].duration).toBe(Time.oneMinute * 30);
            expect(exposures[1].cns).toBeCloseTo(20, 6);
        });
    });

    describe('Exposures window', () => {
        const oneHourExposure: CnsExposure[] = [{ duration: Time.oneHour, cns: 30 }];

        it('Total of empty exposures is 0 %', () => {
            expect(CnsDailyCalculator.total([])).toBeCloseTo(0, 6);
        });

        it('First dive ignores previous exposures', () => {
            const exposures = CnsDailyCalculator.appendDive(oneHourExposure, Number.POSITIVE_INFINITY, oneHourExposure);
            expect(exposures).toEqual(oneHourExposure);
        });

        it('Repetitive dive adds surface interval without CNS', () => {
            const exposures = CnsDailyCalculator.appendDive(oneHourExposure, Time.oneHour, oneHourExposure);
            expect(exposures.length).toBe(3);
            expect(exposures[1]).toEqual({ duration: Time.oneHour, cns: 0 });
            expect(CnsDailyCalculator.total(exposures)).toBeCloseTo(60, 6);
        });

        it('Removes dive older than 24 hours', () => {
            const exposures = CnsDailyCalculator.appendDive(oneHourExposure, Time.oneDay, oneHourExposure);
            expect(CnsDailyCalculator.total(exposures)).toBeCloseTo(30, 6);
        });

        it('Prorates dive partially inside 24 hours', () => {
            const surfaceInterval = Time.oneHour * 22.5;
            const exposures = CnsDailyCalculator.appendDive(oneHourExposure, surfaceInterval, oneHourExposure);
            expect(exposures[0]).toEqual({ duration: Time.oneHour / 2, cns: 15 });
            expect(CnsDailyCalculator.total(exposures)).toBeCloseTo(45, 6);
        });

        it('Trims exposures of single dive longer than 24 hours', () => {
            const longDive: CnsExposure[] = [{ duration: Time.oneDay * 2, cns: 200 }];
            const exposures = CnsDailyCalculator.appendDive([], Number.POSITIVE_INFINITY, longDive);
            expect(exposures).toEqual([{ duration: Time.oneDay, cns: 100 }]);
        });
    });

    describe('Multiple dives', () => {
        // 1.28 bar => 216 min limit => 27.7778 % per dive
        const flatDive = [new Segment(30, 30, StandardGases.ean32, Time.oneHour)];
        const singleDiveCns = 27.7777778;

        const dives = (count: number, surfaceInterval: number): CnsDive[] => {
            const result: CnsDive[] = [];

            for (let index = 0; index < count; index++) {
                const interval = index === 0 ? Number.POSITIVE_INFINITY : surfaceInterval;
                result.push({ profile: flatDive, surfaceInterval: interval });
            }

            return result;
        };

        it('Single dive', () => {
            const cns = sut.calculateForDives(dives(1, Time.oneHour));
            expect(cns).toBeCloseTo(singleDiveCns, 6);
        });

        it('3 dives within 24 hours sum without elimination and stay bellow limit', () => {
            const cns = sut.calculateForDives(dives(3, Time.oneHour * 2));
            expect(cns).toBeCloseTo(83.3333333, 6);
        });

        it('4 dives within 24 hours exceed limit, even each dive is bellow limit', () => {
            const cns = sut.calculateForDives(dives(4, Time.oneHour * 2));
            expect(cns).toBeCloseTo(111.1111111, 6);

            // compare with single dive limit applied with elimination during surface interval
            const cnsCalculator = new CnsCalculator(depthConverter);
            let singleCns = 0;
            dives(4, Time.oneHour * 2).forEach(d => {
                singleCns = cnsCalculator.calculateForRepetitiveDive(d.profile, singleCns, d.surfaceInterval);
            });
            expect(singleCns).toBeCloseTo(53.016733, 6);
        });

        it('3 dives with 12 hours surface interval count only last 24 hours', () => {
            const cns = sut.calculateForDives(dives(3, Time.oneHour * 12));
            expect(cns).toBeCloseTo(singleDiveCns * 2, 6);
        });

        it('3 dives with 24 hours gap before last dive count only the last dive', () => {
            const series = dives(3, Time.oneHour * 2);
            series[2].surfaceInterval = Time.oneDay;
            const cns = sut.calculateForDives(series);
            expect(cns).toBeCloseTo(singleDiveCns, 6);
        });

        it('Following first dive of the day resets previous dives', () => {
            const series = dives(3, Time.oneHour);
            series[2].surfaceInterval = Number.POSITIVE_INFINITY;
            const cns = sut.calculateForDives(series);
            expect(cns).toBeCloseTo(singleDiveCns, 6);
        });

        it('3 real profiles with ascent and descent', () => {
            const calculator = new CnsDailyCalculator(DepthConverter.forFreshWater());
            const profile = ToxicityProfiles.ean32At36m;
            const singleDive = CnsDailyCalculator.total(calculator.exposuresForProfile(profile));
            const cns = calculator.calculateForDives([
                { profile: profile, surfaceInterval: Number.POSITIVE_INFINITY },
                { profile: profile, surfaceInterval: Time.oneHour },
                { profile: profile, surfaceInterval: Time.oneHour }
            ]);
            expect(cns).toBeCloseTo(singleDive * 3, 6);
        });
    });
});
