import { TestBed } from '@angular/core/testing';
import { ChartLegend, ChartPlotterFactory, TraceKind } from './chartPlotter';
import { ProfileHoverValues } from './profileHoverValues';
import { ResamplingService } from './ResamplingService';
import { UnitConversion } from './UnitConversion';
import { DiveResults } from './diveresults';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

describe('ChartPlotterFactory', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ResamplingService, UnitConversion, provideTestTranslate()]
        });
    });

    const createFactory = (): ChartPlotterFactory =>
        new ChartPlotterFactory(TestBed.inject(ResamplingService), TestBed.inject(UnitConversion));

    it('keeps unified hover box by default', () => {
        expect(createFactory().createLayout().hovermode).toBe('x unified');
    });

    // unified hover box is drawn even when all traces have hoverinfo 'none'
    it('uses hover mode without unified box when hover labels are hidden', () => {
        expect(createFactory().withoutHoverLabels().createLayout().hovermode).toBe('x');
    });

    // the same vertical line, which unified hover draws by default
    it('draws vertical hover line when hover labels are hidden', () => {
        const xaxis = createFactory().withoutHoverLabels().createLayout().xaxis;

        expect(xaxis.showspikes).toBeTrue();
        expect(xaxis.spikemode).toBe('across');
        expect(xaxis.spikedash).toBe('dot');
        expect(xaxis.spikethickness).toBe(1.5);
        expect(xaxis.spikecolor).toBe('#444');
    });

    it('hides legend by default', () => {
        expect(createFactory().createLayout().showlegend).toBeFalse();
    });

    it('shows horizontal not clickable legend above the chart when requested', () => {
        const layout = createFactory().withLegendAbove().createLayout();

        expect(layout.showlegend).toBeTrue();
        expect(layout.legend).toEqual(jasmine.objectContaining({
            orientation: 'h',
            x: 0,
            xanchor: 'left',
            y: 1.02,
            yanchor: 'bottom',
            itemclick: false,
            itemdoubleclick: false
        }));
    });

    // hovered values make names longer, fixed columns keep the legend height, so the plot doesn't shrink
    it('keeps legend height stable with fixed columns', () => {
        const legend: ChartLegend | undefined = createFactory().withLegendAbove().createLayout().legend;

        // smaller font fits names with values into half of the plot width on phones
        expect(legend?.font?.size).toBe(10);
        expect(legend?.entrywidth).toBe(0.5);
        expect(legend?.entrywidthmode).toBe('fraction');
        expect(legend?.title).toBeUndefined();
    });

    // legend title would shift the legend entries, chart title in reserved top margin doesn't affect the legend
    it('reserves empty hover title above the legend', () => {
        const layout = createFactory().withLegendAbove().createLayout();

        expect(layout.margin?.t).toBe(70);
        expect(layout.title).toEqual(jasmine.objectContaining({
            text: '',
            xref: 'paper',
            x: 0,
            xanchor: 'left',
            yref: 'container',
            y: 1,
            yanchor: 'top'
        }));
    });

    it('has no hover title without legend', () => {
        expect(createFactory().createLayout().title).toBeUndefined();
    });

    it('keeps default x axis spikes with unified hover box', () => {
        expect(createFactory().createLayout().xaxis.showspikes).toBeUndefined();
    });
});

describe('DiveTracesBuilder', () => {
    let factory: ChartPlotterFactory;
    const dive = new DiveResults();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ResamplingService, UnitConversion, provideTestTranslate()]
        });

        factory = new ChartPlotterFactory(TestBed.inject(ResamplingService), TestBed.inject(UnitConversion));
    });

    it('assigns uid per trace kind', () => {
        const traces = factory.create(() => dive).allTraces();

        expect(traces.map(t => t.uid)).toEqual(['averageDepth', 'depth', 'ceiling', 'events']);
    });

    it('prefixes uid with name prefix', () => {
        const traces = factory.withNamePrefix('diffResultsTable.profileA')
            .create(() => dive).allTraces();

        expect(traces[0].uid).toBe('diffResultsTable.profileA.averageDepth');
    });

    it('hides hover labels when requested', () => {
        const builder = factory.withoutHoverLabels().create(() => dive);
        builder.showEmergencyAscent = true;

        const traces = builder.allTraces();

        expect(traces.length).toBe(5);
        traces.forEach(t => expect(t.hoverinfo).toBe('none'));
    });

    // hovertemplate takes precedence over hoverinfo, the label would still be drawn
    it('removes hover templates when hover labels are hidden', () => {
        const builder = factory.withoutHoverLabels().create(() => dive);
        builder.showEmergencyAscent = true;

        const traces = builder.allTraces();

        traces.forEach(t => expect(t.hovertemplate).toBeUndefined());
    });

    describe('Legend names', () => {
        const hovered = (): ProfileHoverValues => {
            const values = new ProfileHoverValues();
            values.depth = 21;
            values.averageDepth = 25.64;
            return values;
        };

        it('uses plain trace name without hover values', () => {
            const builder = factory.create(() => dive);

            expect(builder.traceName(TraceKind.depth)).toBe('profileChart.depthTraceName');
        });

        it('appends rounded hovered value with units', () => {
            const builder = factory.create(() => dive);

            expect(builder.traceName(TraceKind.averageDepth, hovered())).toBe('profileChart.avgDepthTraceName 25.6 m');
        });

        it('keeps plain name for value missing at hovered time', () => {
            const builder = factory.create(() => dive);

            expect(builder.traceName(TraceKind.ceiling, hovered())).toBe('profileChart.ceilingTraceName');
        });

        it('keeps name prefix', () => {
            const builder = factory.withNamePrefix('diffResultsTable.profileA').create(() => dive);

            expect(builder.traceName(TraceKind.depth, hovered())).toBe('diffResultsTable.profileA profileChart.depthTraceName 21 m');
        });
    });

    it('keeps hover labels by default', () => {
        const traces = factory.create(() => dive).allTraces();

        traces.forEach(t => expect(t.hoverinfo).toBeUndefined());
    });
});
