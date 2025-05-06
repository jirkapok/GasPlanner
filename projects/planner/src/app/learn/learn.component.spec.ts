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

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                CommonModule,
                FormsModule,
                ReactiveFormsModule,
                NgxMdModule,
                FontAwesomeModule,
                LearnComponent, // because standalone: true
            ],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                Urls,
                QuizService,
                { provide: PreferencesStore, useValue: mockPreferencesStore }
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('creates learn with default topic', () => {
        expect(component.activeTopic).toBe('Pressure at depth');
    });

    it('changes quiz question', () => {
        const expectedCategory = 'Used gas';
        component.updateTopic('Consumption', expectedCategory);
        fixture.detectChanges();

        expect(component.currentQuiz?.categoryName).toBe(expectedCategory);
    });
});
