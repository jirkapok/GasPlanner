import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearnComponent } from './learn.component';
import { NgxMdModule } from 'ngx-md';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Urls } from '../shared/navigation.service';
import { QuizService } from '../shared/learn/quiz.service';
import { QuizItem } from '../shared/learn/quiz-item.model';
import { PreferencesStore } from '../shared/preferencesStore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RoundType, Topic, QuestionTemplate } from '../shared/learn/learn.models';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { SubViewStorage } from "../shared/subViewStorage";
import { ViewStates } from "../shared/viewStates";
import { Preferences } from "../shared/preferences";
import { ViewSwitchService } from "../shared/viewSwitchService";
import { DiveSchedules } from "../shared/dive.schedules";
import { UnitConversion } from "../shared/UnitConversion";
import { ReloadDispatcher } from "../shared/reloadDispatcher";
import { ApplicationSettingsService } from "../shared/ApplicationSettings";

// TODO Add missing test cases for: categoryStatus, resetSession
//  submitAnswers, continuePracticing, validateCurrentAnswer
// TODO replace by Spy object
const mockPreferencesStore = {
    load: () => {},
    save: () => {},
    loadDefault: () => {},
    saveDefault: () => {},
    disableDisclaimer: () => {},
    disclaimerEnabled: () => true,
    disableShowInstall: () => {},
    installEnabled: () => true,
};

describe('LearnComponent', () => {
    let component: LearnComponent;
    let fixture: ComponentFixture<LearnComponent>;
    let quizService: QuizService;

    const createMockQuizItem = (): QuizItem => {
        const template: QuestionTemplate = {
            question: 'Mock question with {value}',
            variables: [],
            calculateAnswer: () => 1,
            roundTo: 1,
            roundType: RoundType.round,
        };

        return new QuizItem(template);
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                NgxMdModule,
                FontAwesomeModule,
                LearnComponent,
                MdbModalModule,
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                Urls,
                QuizService,
                { provide: PreferencesStore, useValue: mockPreferencesStore },
                SubViewStorage, ViewStates,
                PreferencesStore, Preferences,
                ViewSwitchService, DiveSchedules,
                UnitConversion, ReloadDispatcher,
                ApplicationSettingsService
            ]
        }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        quizService = TestBed.inject(QuizService);
        fixture.detectChanges();

        // Wait for async initialization to complete
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('creates learn with default topic', () => {
        expect(component.selectedTopic.name).toBe('Pressure at depth');
        expect(component.selectedCategory.name).toBe('Depth');
    });

    it('changes quiz question', () => {
        const expectedCategory = 'Maximum operational depth';
        component.select(quizService.topics[1], quizService.topics[1].categories[0]);
        fixture.detectChanges();

        expect(component.selectedCategory.name).toBe(expectedCategory);
    });
});
