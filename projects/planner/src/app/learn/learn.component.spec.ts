import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearnComponent } from './learn.component';
import { NgxMdModule } from 'ngx-md';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Urls } from '../shared/navigation.service';
import { QuizService, QuizItem } from '../shared/learn/quiz.service';
import { PreferencesStore } from '../shared/preferencesStore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RoundType, Topic, QuestionTemplate } from '../shared/learn/learn.models';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';

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

        return new QuizItem(template, 'Mock Category');
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
                ]
            },
            {
                topic: 'Consumption',
                categories: [
                    {
                        name: 'Used gas',
                        getQuizItemForCategory: () => {
                            const item = createMockQuizItem();
                            item.categoryName = 'Used gas';
                            return item;
                        }
                    }
                ]
            }
        ] as Topic[];
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('creates learn with default topic', () => {
        expect(component.activeTopic).toBe('Pressure at depth');
        expect(component.selectedCategoryName).toBe('Basic Pressure');
        expect(component.currentQuiz?.categoryName).toBe('Mock Category');
    });

    it('changes quiz question', () => {
        const expectedCategory = 'Used gas';
        component.updateTopic('Consumption', expectedCategory);
        fixture.detectChanges();

        expect(component.selectedCategoryName).toBe(expectedCategory);
        expect(component.currentQuiz?.categoryName).toBe(expectedCategory);
    });
});
