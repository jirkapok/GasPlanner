import { Injectable } from '@angular/core';
import { Event, EventType, StandardGases, Precision, Ceiling } from 'scuba-physics';
import { UnitConversion } from './UnitConversion';
import { DateFormats } from './formaters';
import { WayPoint } from './wayPoint';

export interface AxisValues {
    xValues: Date[];
    yValues: number[];
}

export interface EventValues extends AxisValues {
    labels: string[];
}

@Injectable()
export class ResamplingService {
    constructor(private units: UnitConversion) {
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

    public convertEvents(events: Event[]): EventValues {
        const xValues: Date[] = [];
        const yValues: number[] = [];
        const labels: string[] = [];

        // TODO replace by BoundEvent.showInProfileChart
        events.forEach((event) => {
            if (this.isSupportedEvent(event)) {
                xValues.push(DateFormats.toDate(event.timeStamp));
                const convertedDepth = this.convertDepth(event.depth);
                yValues.push(convertedDepth);
                const text = this.formatChartEventText(event);
                labels.push(text);
            }
        });

        return {
            xValues,
            yValues,
            labels
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

    private isSupportedEvent(event: Event): boolean {
        switch (event.type) {
            case EventType.gasSwitch:
            case EventType.noDecoEnd:
            case EventType.safetyStop:
                return true;
            default: return false;
        }
    }

    // TODO move to BoundEvent
    private formatChartEventText(event: Event): string {
        switch (event.type) {
            case EventType.gasSwitch: {
                const gas = event.gas;
                if (gas) {
                    const gasName = StandardGases.nameFor(gas.fO2, gas.fHe);
                    return gasName;
                }

                return '';
            }
            case EventType.noDecoEnd:
                return 'Deco';
            case EventType.safetyStop:
                return 'Safety stop';
            default: return '';
        }
    }
}
