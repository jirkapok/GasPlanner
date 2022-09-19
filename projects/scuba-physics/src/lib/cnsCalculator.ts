import { DepthConverter } from './depth-converter';
import { Segment } from './Segments';
import { Time } from './Time';


class CnsRange {
    constructor(
        public minPo2: number,
        public maxPo2: number,
        public slope: number,
        public intercept: number) { }
}

/**
 * Reference: https://www.shearwater.com/wp-content/uploads/2012/08/Oxygen_Toxicity_Calculations.pdf
 * Shortcuts for the most common operations:
 *   AAP = absolute atmospheric pressure
 *   ppO2 = partial pressure of oxygen
 *   fO2 = oxygen fraction
 */
export class CnsCalculator {
    private readonly minimumPpO2 = 0.5;
    private cnsTable: CnsRange[] = [
        new CnsRange(0.5, 0.6, -1800, 1800),
        new CnsRange(0.6, 0.7, -1500, 1620),
        new CnsRange(0.7, 0.8, -1200, 1410),
        new CnsRange(0.8, 0.9, -900, 1170),
        new CnsRange(0.9, 1.1, -600, 900),
        new CnsRange(1.1, 1.5, -300, 570),
        new CnsRange(1.5, 1.6, -750, 1245)
    ];

    constructor(private depthConverter: DepthConverter) { }

    /** Calculates total CNS % for provided profile */
    public calculateForProfile(profile: Segment[]): number {
        let total = 0;

        profile.forEach(segment => {
            const o2 = segment.gas.fO2;
            const minutes = Time.toMinutes(segment.duration);
            const partCns = this.calculate(o2, segment.startDepth, segment.endDepth, minutes);
            total += partCns;
        });

        return total;
    }

    /**
     * @param fO2 oxygen fraction
     * @param startDepth starting depth in meters
     * @param endDepth end depth in meters
     * @param duration duration in minutes
     */
    public calculate(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        if (startDepth === endDepth) {
            return this.calculateFlat(fO2, startDepth, duration);
        }

        return this.calculateDiff(fO2, startDepth, endDepth, duration);
    }

    /**
     * @param fO2 oxygen fraction
     * @param depth depth in meters
     * @param duration minutes of dive
     */
    private calculateFlat(fO2: number, depth: number, duration: number): number {
        const aap = this.depthConverter.toBar(depth);
        const ppO2 = fO2 * aap;
        return this.cnsFlatByPo2(ppO2, duration);
    }

    private calculateDiff(fO2: number, startDepth: number, endDepth: number, duration: number): number {
        const startAap = this.depthConverter.toBar(startDepth);
        const endAap = this.depthConverter.toBar(endDepth);
        const maxAap = Math.max(startAap, endAap);
        const minAap = Math.min(startAap, endAap);
        const maxPpO2 = maxAap * fO2;
        const minPpO2 = minAap * fO2;

        if (maxPpO2 <= this.minimumPpO2) {
            return 0;
        }

        const lowPpO2 = minPpO2 < this.minimumPpO2 ? this.minimumPpO2 : minPpO2;

        const o2time = duration * (maxPpO2 - lowPpO2) / (maxPpO2 - minPpO2);
        const oTime = [];
        const segPpO2 = [];
        const ppO2o = [];
        const ppO2f = [];

        for (let i = 0; i <= 6; i++) {
            const item = this.cnsTable[i];

            if ((maxPpO2 > item.minPo2) && (lowPpO2 <= item.maxPo2)) {
                if ((maxPpO2 >= item.maxPo2) && (lowPpO2 < item.minPo2)) {
                    if (startDepth > endDepth) {
                        ppO2o.push(item.maxPo2);
                        ppO2f.push(item.minPo2);
                    } else {
                        ppO2o.push(item.minPo2);
                        ppO2f.push(item.maxPo2);
                    }
                } else if ((maxPpO2 < item.maxPo2) && (lowPpO2 <= item.minPo2)) {
                    if (startDepth > endDepth) {
                        ppO2o.push(maxPpO2);
                        ppO2f.push(item.minPo2);
                    } else {
                        ppO2o.push(item.minPo2);
                        ppO2f.push(maxPpO2);
                    }
                } else if ((lowPpO2 > item.minPo2) && (maxPpO2 >= item.maxPo2)) {
                    if (startDepth > endDepth) {
                        ppO2o.push(item.maxPo2);
                        ppO2f.push(lowPpO2);
                    } else {
                        ppO2o.push(lowPpO2);
                        ppO2f.push(item.maxPo2);
                    }
                } else {
                    if (startDepth > endDepth) {
                        ppO2o.push(maxPpO2);
                        ppO2f.push(lowPpO2);
                    } else {
                        ppO2o.push(lowPpO2);
                        ppO2f.push(maxPpO2);
                    }
                }

                segPpO2.push(ppO2f[i] - ppO2o[i]);
                const current = o2time * Math.abs(segPpO2[i]) / (maxPpO2 - lowPpO2);
                oTime.push(current);
            } else {
                oTime.push(0);
            }
        }

        let result = 0;

        for (let i = 0; i <= 6; i++) {
            if (oTime[i] === 0) {
                continue;
            }

            const slope = this.cnsTable[i].slope;
            const intercept = this.cnsTable[i].intercept;

            const timeLimit = slope * ppO2o[i] + intercept;
            const mk = slope * (segPpO2[i] / oTime[i]);
            const cnsI = 1.0 / mk * (Math.log(Math.abs(timeLimit + mk * oTime[i])) - Math.log(Math.abs(timeLimit)));
            result += Math.abs(cnsI);
        }

        return result;
    }

    /**
     * @param ppO2 partial pressure of oxygen
     * @param duration minutes of dive
     */
    private cnsFlatByPo2(ppO2: number, duration: number): number {
        if (ppO2 < this.minimumPpO2) {
            return 0;
        }

        const limits = this.findCnsTableEntry(ppO2); // ?: error("ppO2 is too high!")
        const timeLimit = limits.slope * ppO2 + limits.intercept;
        return duration / timeLimit;
    }

    private findCnsTableEntry(ppO2: number): CnsRange {
        for (const level of this.cnsTable) {
            if (level.minPo2 < ppO2 && ppO2 <= level.maxPo2) {
                return level;
            }
        }

        return new CnsRange(0, 0, 0, 0);
    }
}
