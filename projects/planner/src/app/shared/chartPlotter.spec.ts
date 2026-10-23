import { TestBed } from '@angular/core/testing';
import { ChartPlotterFactory } from './chartPlotter';
import { ResamplingService } from './ResamplingService';
import { UnitConversion } from './UnitConversion';
import { DiveResults } from './diveresults';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

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

    it('keeps hover labels by default', () => {
        const traces = factory.create(() => dive).allTraces();

        traces.forEach(t => expect(t.hoverinfo).toBeUndefined());
    });
});
