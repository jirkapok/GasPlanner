import { TestBed } from '@angular/core/testing';
import { ChartPlotterFactory } from './chartPlotter';
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

    it('keeps hover labels by default', () => {
        const traces = factory.create(() => dive).allTraces();

        traces.forEach(t => expect(t.hoverinfo).toBeUndefined());
    });
});
