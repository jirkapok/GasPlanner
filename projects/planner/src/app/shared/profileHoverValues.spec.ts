import * as Plotly from 'plotly.js-dist';
import { ProfileHoverValues } from './profileHoverValues';
import { TraceKind } from './chartPlotter';

describe('ProfileHoverValues', () => {
    const point = (uid: string, y: number, text = ''): Plotly.PlotDatum =>
        ({ x: '1970-02-01 00:29:00', y, text, data: { uid } }) as unknown as Plotly.PlotDatum;

    it('reads values by trace kind', () => {
        const sut = ProfileHoverValues.fromPoints([
            point(TraceKind.averageDepth, 25.6),
            point(TraceKind.depth, 21),
            point(TraceKind.ceiling, 5)
        ]);

        expect(sut.depth).toBe(21);
        expect(sut.averageDepth).toBe(25.6);
        expect(sut.ceiling).toBe(5);
        expect(sut.timeStamp).toBe(1740);
    });

    it('resolves kind from prefixed uid', () => {
        expect(ProfileHoverValues.traceKind('diffResultsTable.profileA.depth')).toBe(TraceKind.depth);
        expect(ProfileHoverValues.traceKind('unknown')).toBeUndefined();
        expect(ProfileHoverValues.traceKind(undefined)).toBeUndefined();
    });

    it('omits zero ceiling', () => {
        const sut = ProfileHoverValues.fromPoints([point(TraceKind.ceiling, 0)]);

        expect(sut.ceiling).toBeUndefined();
    });

    it('collects event texts', () => {
        const sut = ProfileHoverValues.fromPoints([
            point(TraceKind.events, 21, 'Gas switch to EAN50'),
            point(TraceKind.events, 21, 'Low gas')
        ]);

        expect(sut.events).toEqual(['Gas switch to EAN50', 'Low gas']);
    });

    it('has no events and no emergency depth when not hovered', () => {
        const sut = ProfileHoverValues.fromPoints([point(TraceKind.depth, 21)]);

        expect(sut.events).toEqual([]);
        expect(sut.emergencyDepth).toBeUndefined();
    });

    it('reads emergency depth', () => {
        const sut = ProfileHoverValues.fromPoints([point(TraceKind.emergency, 18)]);

        expect(sut.emergencyDepth).toBe(18);
    });
});
