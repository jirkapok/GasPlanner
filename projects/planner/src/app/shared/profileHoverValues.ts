import * as Plotly from 'plotly.js-dist';
import { TraceKind } from './chartPlotter';
import { DateFormats } from './formaters';

/** Values of the profile chart traces at the hovered time */
export class ProfileHoverValues {
    /** seconds from dive start */
    public timeStamp = 0;
    public depth?: number;
    public averageDepth?: number;
    /** undefined when ceiling is 0 */
    public ceiling?: number;
    public emergencyDepth?: number;
    public events: string[] = [];

    public static fromPoints(points: Plotly.PlotDatum[]): ProfileHoverValues {
        const result = new ProfileHoverValues();
        result.timeStamp = DateFormats.secondsFromDate(String(points[0]?.x));
        points.forEach(p => result.apply(p));
        return result;
    }

    public static traceKind(uid: string | undefined): TraceKind | undefined {
        const candidate = uid?.split('.').pop();
        return Object.values(TraceKind).find(k => k === candidate);
    }

    private apply(point: Plotly.PlotDatum): void {
        const value = Number(point.y);

        switch (ProfileHoverValues.traceKind(point.data?.uid)) {
            case TraceKind.depth:
                this.depth = value;
                break;
            case TraceKind.averageDepth:
                this.averageDepth = value;
                break;
            case TraceKind.ceiling:
                this.ceiling = value > 0 ? value : undefined;
                break;
            case TraceKind.emergency:
                this.emergencyDepth = value;
                break;
            case TraceKind.events:
                this.events.push(point.text);
                break;
        }
    }
}
