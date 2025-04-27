import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { LearnComponent } from "./learn.component";
import { Urls } from "../shared/navigation.service";
import { NgxMdModule } from "ngx-md";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe('Learn component', () => {
    let component: LearnComponent;
    let fixture: ComponentFixture<LearnComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [ReactiveFormsModule, NgxMdModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                Urls
            ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(LearnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Creates learn with default topic', () => {
        expect(component.activeTopic).toBe('Nitrox');
    });

    it('Changes quiz question', () => {
        const expectedCategory = 'Used gas';
        component.updateTopic('Consumption', expectedCategory);

        expect(component.currentQuiz?.categoryName).toBe(expectedCategory);
    });
});
