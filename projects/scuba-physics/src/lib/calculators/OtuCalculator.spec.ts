import { DepthConverter } from '../depth-converter';
import { OtuCalculator } from './OtuCalculator';
import { Segment } from '../Segments';
import { Time } from '../Time';
import { StandardGases } from '../StandardGases';

/**
 *  fresh water, sea level altitude, 1032 bar surface, 1000 density
 *  values obtained from SubSurface for comparison
 */
export class ToxicityProfiles {
    /* cns 25 %, otu 64, this is high ppO2 test */
    public static ean32At36m: Segment[] = [
        new Segment(0, 36, StandardGases.ean32, Time.oneMinute * 3),
        new Segment(36, 36, StandardGases.ean32, Time.oneMinute * 22),
        new Segment(36, 0, StandardGases.ean32, Time.oneMinute * 30)
    ];

    /* cns 127 %, otu 115 */
    public static oxygenAt6m: Segment[] = [
        new Segment(0, 6, StandardGases.oxygen, Time.oneMinute * 1),
        new Segment(6, 6, StandardGases.oxygen, Time.oneMinute * 58),
        new Segment(6, 0, StandardGases.oxygen, Time.oneMinute * 1)
    ];


    /* cns 7 %, otu 21 */
    public static airAt40m: Segment[] = [
        new Segment(0, 40, StandardGases.air, Time.oneMinute * 3),
        new Segment(40, 40, StandardGases.air, Time.oneMinute * 17),
        new Segment(40, 15, StandardGases.air, Time.oneMinute * 3),
        new Segment(15, 15, StandardGases.air, Time.oneMinute * 1),
        new Segment(15, 12, StandardGases.air, Time.oneMinute * 1),
        new Segment(12, 12, StandardGases.air, Time.oneMinute * 1),
        new Segment(12, 9, StandardGases.air, Time.oneMinute * 1),
        new Segment(9, 9, StandardGases.air, Time.oneMinute * 5),
        new Segment(9, 6, StandardGases.air, Time.oneMinute * 1),
        new Segment(6, 6, StandardGases.air, Time.oneMinute * 23),
        new Segment(6, 0, StandardGases.air, Time.oneMinute * 2),
    ];

    /* cns 41 %, otu 62 */
    public static trimixAt50m: Segment[] = [
        new Segment(0, 50, StandardGases.trimix1845, Time.oneMinute * 3),
        new Segment(50, 50, StandardGases.trimix1845, Time.oneMinute * 17),
        new Segment(50, 24, StandardGases.trimix1845, Time.oneMinute * 3),
        new Segment(24, 24, StandardGases.trimix1845, Time.oneMinute * 1),
        new Segment(24, 21, StandardGases.trimix1845, Time.oneMinute * 1),
        new Segment(21, 21, StandardGases.ean50, Time.oneMinute * 3),
        new Segment(21, 9, StandardGases.ean50, Time.oneMinute * 4),
        new Segment(9, 9, StandardGases.ean50, Time.oneMinute * 2),
        new Segment(9, 6, StandardGases.ean50, Time.oneMinute * 1),

        new Segment(6, 6, StandardGases.oxygen, Time.oneMinute * 12),
        new Segment(6, 0, StandardGases.oxygen, Time.oneMinute * 2),
    ];
}

describe('OtuCalculatorService', () => {
    const otuCalculator = new OtuCalculator(DepthConverter.simple());

    describe('Segments', () => {
        it('0 OTU for empty segments', () => {
            const emptyProfile: Segment[] = [];
            const otu = otuCalculator.calculateForProfile(emptyProfile);
            expect(otu).toBe(0);
        });

        const gas = StandardGases.ean32.copy();
        const profile: Segment[] = [
            new Segment(0, 36, gas, Time.oneMinute * 3),
            new Segment(36, 36, gas, Time.oneMinute * 22),
            new Segment(36, 0, gas, Time.oneMinute * 30)
        ];

        it('OTU counts as sum of all segments', () => {
            const otu = otuCalculator.calculateForProfile(profile);
            expect(otu).toBeCloseTo(64.8711617, 7);
        });

        it('Applies depth converter', () => {
            const calculator = new OtuCalculator(DepthConverter.forSaltWater());
            const otu = calculator.calculateForProfile(profile);
            expect(otu).toBeCloseTo(65.9177262, 7);
        });
    });

    describe('Flat - depth does not change', () => {
        it('0 OTU for 0 min at 0 ppO2', () => {
            const otu = otuCalculator.calculate(0, 0, 0, 0);
            expect(otu).toBe(0);
        });

        it('0 OTU for 22 min at .4 ppO2', () => {
            const otu = otuCalculator.calculate(22.0, .4, 0, 0);
            expect(otu).toBe(0);
        });

        it('0 OTU for 0 min at .4 ppO2', () => {
            const otu = otuCalculator.calculate(0, 1, 0, 0);
            expect(otu).toBe(0);
        });

        it('38.6762 OTU for 22min at 1.484 ppO2', () => {
            const otu = otuCalculator.calculate(1320, 1.484, 0, 0);
            expect(otu).toBe(38.676181761978775);
        });

        it('38.5818 OTU for 20 min at 1.6 ppO2', () => {
            const otu = otuCalculator.calculate(1200, 1.6, 0, 0);
            expect(otu).toBeCloseTo(38.5817773, 7);
        });

        it('28.9712 OTU for 20 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculate(1200, .32, 30, 36);
            expect(otu).toBeCloseTo(31.9046752, 7);
        });
    });

    describe('Difference - depth does change', () => {
        it('0 OTU for 20 min with 0 pO2 in 30 metres', () => {
            const otu = otuCalculator.calculate(1200, 0, 20, 30);
            expect(otu).toBe(0);
        });

        it('0 OTU for 0 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculate(0, .32, 20, 30);
            expect(otu).toBe(0);
        });

        it('28.9 OTU for 20 min with EAN32 in 30 metres', () => {
            const otu = otuCalculator.calculate(1320, .32, 36, 36);
            expect(otu).toBe(38.28272978563932);
        });

        it('2.4026 OTU for 3 min with EAN32 from 0 m to 36 m', () => {
            const otu = otuCalculator.calculate(180, .32, 0, 36);
            expect(otu).toBeCloseTo(2.4171302, 7);
        });

        it('24.0256 OTU for 30 min with EAN32 from 36 m to 0 m', () => {
            const otu = otuCalculator.calculate(1800, .32, 36, 0);
            expect(otu).toBeCloseTo(24.1713018, 7);
        });
    });

    describe('Complex profiles', () => {
        const calculator = new OtuCalculator(DepthConverter.forFreshWater());

        it('Ean32 at 36 m - 64 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.ean32At36m);
            expect(otu).toBeCloseTo(63.8879499, 7);
        });

        it('Oxygen at 6 m - 115 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.oxygenAt6m);
            expect(otu).toBeCloseTo(114.9995884, 7);
        });

        it('Air at 40 m - 21 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.airAt40m);
            expect(otu).toBeCloseTo(20.8817664, 7);
        });

        it('Trimix 18/45 at 50 m - 62 OTU', () => {
            const otu = calculator.calculateForProfile(ToxicityProfiles.trimixAt50m);
            expect(otu).toBeCloseTo(62.4140139, 7);
        });
    });
});
