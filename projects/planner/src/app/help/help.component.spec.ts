import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HelpComponent } from "./help.component";
import { Urls } from "../shared/navigation.service";
import { NgxMdModule } from "ngx-md";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";

describe('Help component', () => {
    let component: HelpComponent;
    let fixture: ComponentFixture<HelpComponent>;

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
        fixture = TestBed.createComponent(HelpComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Creates help with default document', () => {
        expect(component.path).toBe('assets/doc/application.md');
    });

    it('Navigates to section', () => {
        const section = 'repetitive-dives-and-surface-interval';
        const selectedSection = { path: 'depths', anchor: section };
        component.updatePath(selectedSection);

        expect(component.path).toBe('assets/doc/depths.md');
        const isActive = component.isActiveSection({ id: 'plan' });
        expect(isActive).toBeTruthy();
    });
});
