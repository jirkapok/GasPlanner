import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HelpComponent } from "./help.component";
import { Urls } from "../shared/navigation.service";
import { NgxMdModule } from "ngx-md";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { SubViewStorage } from "../shared/subViewStorage";
import { ViewStates } from "../shared/viewStates";
import { PreferencesStore } from "../shared/preferencesStore";
import { Preferences } from "../shared/preferences";
import { ViewSwitchService } from "../shared/viewSwitchService";
import { DiveSchedules } from "../shared/dive.schedules";
import { UnitConversion } from "../shared/UnitConversion";
import { ReloadDispatcher } from "../shared/reloadDispatcher";
import { ApplicationSettingsService } from "../shared/ApplicationSettings";

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
                Urls, SubViewStorage, ViewStates,
                PreferencesStore, Preferences,
                ViewSwitchService, DiveSchedules,
                UnitConversion, ReloadDispatcher,
                ApplicationSettingsService
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
