import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Precision, Ceiling } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { DateFormats } from './formaters';
import { WayPoint } from './wayPoint';
import { BoundEvent } from './models';

export interface AxisValues {
    xValues: Date[];
    yValues: number[];
}

export interface EventValues extends AxisValues {
    labels: string[];
    textPositions: string[];
}

@Injectable()
export class ResamplingService {
    /** Part of the dive duration, under which two event labels are considered as overlapping */
    private static readonly closeEventsRatio = 0.05;
    private static readonly labelAbove = 'top center';
    private static readonly labelBelow = 'bottom center';

    constructor(private units: UnitConversion, private translate: TranslateService) {
    }

    public resampleAverageDepth(wayPoints: WayPoint[]): AxisValues {
        const xValues: Date[] = [];
        const yValues: number[] = [];

        if (wayPoints.length > 0) {
            this.transformAverageDepth(wayPoints, xValues, yValues);
        }

        return {
            xValues,
            yValues
        };
    }

    /**
     * Labels of events closer than the threshold alternate above and below the profile to prevent their overlap,
     * e.g. gas switches during air breaks.
     * @param totalDuration in seconds, x axis range used to decide, which events are close to each other.
     */
    public convertEvents(events: BoundEvent[], totalDuration: number): EventValues {
        const xValues: Date[] = [];
        const yValues: number[] = [];
        const labels: string[] = [];
        const textPositions: string[] = [];
        const minLabelsDistance = totalDuration * ResamplingService.closeEventsRatio;
        let lastTimeStamp = Number.NEGATIVE_INFINITY;
        let lastPosition = ResamplingService.labelBelow;

        events.forEach((event) => {
            if (event.showInProfileChart) {
                xValues.push(DateFormats.toDate(event.timeStamp));
                const convertedDepth = event.depth;
                yValues.push(convertedDepth);
                const text = event.chartEventText;
                labels.push(this.translate.instant(text));

                const isClose = event.timeStamp - lastTimeStamp < minLabelsDistance;
                lastPosition = isClose && lastPosition === ResamplingService.labelAbove ?
                    ResamplingService.labelBelow : ResamplingService.labelAbove;
                textPositions.push(lastPosition);
                lastTimeStamp = event.timeStamp;
            }
        });

        return {
            xValues,
            yValues,
            labels,
            textPositions
        };
    }

    public resampleCeilings(ceilings: Ceiling[]): AxisValues {
        const xValues: Date[] = [];
        const yValues: number[] = [];

        // possible performance optimization = remove all waypoints, where ceiling = 0 and depth didn't change
        ceilings.forEach((item) => {
            xValues.push(DateFormats.toDate(item.time));
            const depth = this.convertDepth(item.depth);
            yValues.push(depth);
        });

        return {
            xValues,
            yValues
        };
    }

    public resampleWaypoints(wayPoints: WayPoint[]): AxisValues {
        const xValues: Date[] = [];
        const yValues: number[] = [];

        wayPoints.forEach((item) => {
            this.resampleDepthsToSeconds(xValues, yValues, item);
        });

        return {
            xValues,
            yValues
        };
    }

    private resampleDepthsToSeconds(xValues: Date[], yValues: number[], item: WayPoint) {
        const speed = (item.endDepthMeters - item.startDepthMeters) / item.duration;
        for (let timeStamp = item.startTime; timeStamp < item.endTime; timeStamp++) {
            xValues.push(DateFormats.toDate(timeStamp));
            const depth = item.startDepthMeters + (timeStamp - item.startTime) * speed;
            const rounded = this.convertDepth(depth);
            yValues.push(rounded);
        }

        // fix end of the dive
        xValues.push(DateFormats.toDate(item.endTime));
        const endDepth = this.convertDepth(item.endDepthMeters);
        yValues.push(endDepth);
    }

    private transformAverageDepth(waiPoints: WayPoint[], xValues: Date[], yValues: number[]): number {
        if (waiPoints.length <= 0) {
            return 0;
        }

        let cumulativeAverage = 0;
        let totalDuration = 0;

        // Uses cumulative average to prevent number overflow for large segment durations
        waiPoints.forEach(wayPoint => {
            if (wayPoint.duration > 0) {
                for (let seconds = 0; seconds < wayPoint.duration; seconds++) {
                    xValues.push(DateFormats.toDate(totalDuration));
                    const depth = wayPoint.depthAt(seconds);
                    const cumulativeWeight = depth + totalDuration * cumulativeAverage;
                    totalDuration++;
                    cumulativeAverage = cumulativeWeight / totalDuration;
                    const rounded = this.convertDepth(cumulativeAverage);
                    yValues.push(rounded);
                }
            }
        });

        return cumulativeAverage;
    }

    private convertDepth(metersDepth: number): number {
        const converted = this.units.fromMeters(metersDepth);
        return Precision.round(converted, 1);
    }
}
