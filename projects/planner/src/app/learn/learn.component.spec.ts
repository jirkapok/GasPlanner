import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LearnComponent } from './learn.component';
import { NgxMdModule } from 'ngx-md';
import { provideHttpClient } from '@angular/common/http';
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
                SubViewStorage, ViewStates, Preferences, PreferencesStore,
                ViewSwitchService, DiveSchedules,
                UnitConversion, ReloadDispatcher,
                ApplicationSettingsService
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
        expect(component.selectedTopic.name).toBe('Pressure at depth');
        expect(component.selectedCategory.name).toBe('Depth');
    });

    it('Select category changes quiz question', () => {
        const topic = component.quizService.topics[1];
        component.select(topic, topic.categories[0]);
        fixture.detectChanges();

        expect(component.selectedCategory).toBe(topic.categories[0]);
    });

    it('Reset session resets session and switches to new question', () => {
        const resetSpy = spyOn(component.quizService.session, 'reset').and.callThrough();
        const nextQuestionSpy = spyOn(component.quizService, 'goToNextQuestion').and.callThrough();
        const prefsSpy = spyOn(prefs, 'save').and.callThrough();

        component.resetSession();

        expect(resetSpy).toHaveBeenCalledWith();
        expect(nextQuestionSpy).toHaveBeenCalledWith();
        expect(prefsSpy).toHaveBeenCalledWith();
    });

    it('Submits answer switches to score', () => {
        for (let index = 0; index < 5; index++) {
            component.session.answerCorrectly();
        }

        const validationSpy = spyOn(component.question, 'validateAnswer').and.callThrough();
        const prefsSpy = spyOn(prefs, 'save').and.callThrough();

        component.validateCurrentAnswer();

        expect(validationSpy).toHaveBeenCalledWith();
        expect(component.showScore).toBeTruthy();
        expect(prefsSpy).toHaveBeenCalledWith();
    });

    it('Continue practicing switches to new question', () => {
        const oldQuestion = component.question;
        component.continuePracticing();

        expect(component.showScore).toBeFalsy();
        expect(component.question).not.toBe(oldQuestion);
    });
});
