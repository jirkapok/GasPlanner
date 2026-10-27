import { ApplicationRef, importProvidersFrom } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgxMdModule } from 'ngx-md';
import { DashboardStartUp } from './startUp';
import { PreferencesStore } from './preferencesStore';
import { PlanUrlSerialization } from './PlanUrlSerialization';
import { SubViewStorage } from './subViewStorage';
import { ViewStates } from './viewStates';
import { HelpService } from './learn/help.service';
import { createSpyObj } from '../../testing/spy-testing.helpers';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';

describe('DashboardStartUp', () => {
    let sut: DashboardStartUp;

    beforeEach(() => {
        // only the welcome timer, Angular scheduler still uses real animation frames
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const preferences = createSpyObj<PreferencesStore>(
            ['disclaimerEnabled', 'installEnabled', 'quizWelcomeEnabled', 'disableQuizWelcome']);
        preferences.quizWelcomeEnabled.mockReturnValue(true);
        const urlSerialization = createSpyObj<PlanUrlSerialization>(['fromUrl', 'toUrl']);
        urlSerialization.toUrl.mockReturnValue('');

        TestBed.configureTestingModule({
            providers: [
                DashboardStartUp,
                // the overlay subscribes to location to close on navigation
                provideLocationMocks(),
                { provide: PreferencesStore, useValue: preferences },
                { provide: PlanUrlSerialization, useValue: urlSerialization },
                { provide: SubViewStorage, useValue: createSpyObj<SubViewStorage>(['saveMainView']) },
                { provide: ViewStates, useValue: { started: true } },
                provideHttpClient(),
                provideHttpClientTesting(),
                importProvidersFrom(NgxMdModule.forRoot()),
                provideTestTranslate()
            ]
        });

        sut = TestBed.inject(DashboardStartUp);
    });

    afterEach(() => {
        TestBed.inject(HelpService).closeHelp();
        vi.useRealTimers();
    });

    it('opens learn welcome sidebar after three minutes', async () => {
        sut.onDashboard();
        vi.advanceTimersByTime(3 * 60 * 1000);
        await TestBed.inject(ApplicationRef).whenStable();

        expect(document.querySelector('app-help-sidebar aside')).not.toBeNull();
    });
});
