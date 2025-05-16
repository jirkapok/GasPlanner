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

// TODO Add missing test cases for: getQuizStats, resetSession, shouldShowForm, shouldShowFinishButton,
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
            ]
        }).compileComponents();

        quizService = TestBed.inject(QuizService);

        quizService.topics = [
            {
                topic: 'Pressure at depth',
                categories: [
                    {
                        name: 'Basic Pressure',
                        getQuizItemForCategory: () => createMockQuizItem()
                    }
                ],
                getCategoryByNameOrEmpty: function (name: string) {
                    return this.categories.find(c => c.name === name);
                }
            },
            {
                topic: 'Consumption',
                categories: [
                    {
                        name: 'Used gas',
                        getQuizItemForCategory: () => createMockQuizItem()
                    }
                ],
                getCategoryByNameOrEmpty: function (name: string) {
                    return this.categories.find(c => c.name === name);
                }
            }
        ] as Topic[];
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        // Wait for async initialization to complete
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('creates learn with default topic', () => {
        expect(component.selectedTopic.topic).toBe('Pressure at depth');
        expect(component.selectedCategory.name).toBe('Basic Pressure');
    });

    it('changes quiz question', () => {
        const expectedCategory = 'Used gas';
        component.updateTopic(quizService.topics[1], quizService.topics[1].categories[0]);
        fixture.detectChanges();

        expect(component.selectedCategory.name).toBe(expectedCategory);
    });
});
