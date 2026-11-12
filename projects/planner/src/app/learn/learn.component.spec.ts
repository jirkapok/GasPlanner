import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearnComponent } from './learn.component';
import { provideDocsMarkdown } from '../shared/markdownDocs';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Urls } from '../shared/navigation.service';
import { QuizService } from '../shared/learn/quiz.service';
import { PreferencesStore } from '../shared/preferencesStore';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { LanguageService } from '../shared/language.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';
import { renderOnPush } from '../../testing/onPush.testing';
import { TranslateService } from '@ngx-translate/core';

describe('LearnComponent', () => {
    let component: LearnComponent;
    let fixture: ComponentFixture<LearnComponent>;
    let prefs: PreferencesStore;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                FontAwesomeModule,
                LearnComponent,
                MdbModalModule,
            ],
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                provideDocsMarkdown(),
                Urls,
                QuizService,
                SubViewStorage, ViewStates, Preferences, PreferencesStore,
                ViewSwitchService, DiveSchedules,
                UnitConversion, ReloadDispatcher,
                ApplicationSettingsService,
                LanguageService, provideTestTranslate()
            ]
        }).compileComponents();
    });

    beforeEach(async () => {
        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        prefs = fixture.debugElement.injector.get(PreferencesStore);
        fixture.detectChanges();

        // Wait for async initialization to complete
        await fixture.whenStable();
        fixture.detectChanges();
    });

    it('Creates learn with default topic', () => {
        expect(component.selectedTopic.name).toBe('learn.topics.pressureAtDepth');
        expect(component.selectedCategory.name).toBe('learn.categories.examples_depth');
    });

    it('Select category changes quiz question', () => {
        const topic = component.quizService.topics[1];
        component.select(topic, topic.categories[0]);
        fixture.debugElement.injector.get(ChangeDetectorRef).markForCheck();
        fixture.detectChanges();

        expect(component.selectedCategory).toBe(topic.categories[0]);
    });

    it('Reset session resets session and switches to new question', () => {
        const resetSpy = vi.spyOn(component.quizService.session, 'reset');
        const nextQuestionSpy = vi.spyOn(component.quizService, 'goToNextQuestion');
        const prefsSpy = vi.spyOn(prefs, 'save');

        component.resetSession();

        expect(resetSpy).toHaveBeenCalledWith();
        expect(nextQuestionSpy).toHaveBeenCalledWith();
        expect(prefsSpy).toHaveBeenCalledWith();
    });

    it('Submits answer switches to score', () => {
        for (let index = 0; index < 5; index++) {
            component.session.answerCorrectly();
        }

        const validationSpy = vi.spyOn(component.question, 'validateAnswer');
        const prefsSpy = vi.spyOn(prefs, 'save');

        component.validateCurrentAnswer();

        expect(validationSpy).toHaveBeenCalledWith();
        expect(component.showScore).toBeTruthy();
        expect(prefsSpy).toHaveBeenCalledWith();
    });

    it('Answered questions are part of saved preferences', () => {
        component.session.answerCorrectly();

        const saved = TestBed.inject(Preferences).toPreferences().quizSessions;
        const selected = saved.find(s => s.category === component.selectedCategory.name);
        expect(selected?.totalAnswered).toBe(1);
    });

    it('Continue practicing switches to new question', () => {
        const oldQuestion = component.question;
        component.continuePracticing();

        expect(component.showScore).toBeFalsy();
        expect(component.question).not.toBe(oldQuestion);
    });
});

describe('LearnComponent OnPush', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [LearnComponent],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(),
                Urls, QuizService, SubViewStorage, ViewStates, Preferences, PreferencesStore,
                ViewSwitchService, DiveSchedules, UnitConversion, ReloadDispatcher,
                ApplicationSettingsService, LanguageService, provideTestTranslate()
            ]
        });
    });

    it('renders question selected outside Angular events', async () => {
        const fixture = await renderOnPush(LearnComponent);
        const quizService = TestBed.inject(QuizService);
        const topic = quizService.topics[1];

        quizService.selectByName(topic.name, topic.categories[0].name);
        await fixture.whenStable();

        const text = (fixture.nativeElement as HTMLElement).textContent;
        expect(text).toContain(`${topic.name} / ${topic.categories[0].name}`);
        expect(text).toContain(quizService.question.renderedQuestion);
    });

    it('renders question retranslated outside Angular events', async () => {
        const fixture = await renderOnPush(LearnComponent);
        const templateKey = TestBed.inject(QuizService).question.templateKey;
        const translate = TestBed.inject(TranslateService);
        translate.setTranslation('cs', { [templateKey]: 'Ceska otazka' });

        translate.use('cs');
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ceska otazka');
    });
});
