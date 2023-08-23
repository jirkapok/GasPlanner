import { TestBed, inject } from '@angular/core/testing';
import { AppStates, NitroxViewState, SacViewState } from './serialization.model';
import { ViewStates } from './viewStates';


describe('SubView', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            providers: [
            ],
            imports: []
        }).compileComponents();
    });

    beforeEach(() => {
    });

    fit('loads saved view states', inject([],
        () => {
            const nitrox: NitroxViewState =  {
                ppO2: 1.1,
                id: 'nitrox'
            };

            const sac: SacViewState = {
                sac: 14,
                id: 'sac'
            };
            const source: AppStates = {
                lastScreen: '',
                states: [ nitrox, sac]
            };
            const serialized = JSON.stringify(source);
            const deserialized = JSON.parse(serialized) as AppStates;
            const views = new ViewStates();
            views.loadFrom(deserialized.states);

            const result = views.get<NitroxViewState>('nitrox');
            expect(result).not.toBeNull();
        }));
});
