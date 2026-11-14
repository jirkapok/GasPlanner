import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HelpComponent } from './help.component';
import { Urls } from '../shared/navigation.service';
import { provideDocsMarkdown } from '../shared/markdownDocs';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { renderOnPush } from '../../testing/onPush.testing';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DiveSchedules } from '../shared/dive.schedules';
import { UnitConversion } from '../shared/UnitConversion';
import { ReloadDispatcher } from '../shared/reloadDispatcher';
import { ApplicationSettingsService } from '../shared/ApplicationSettings';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';
import { LanguageService } from '../shared/language.service';
import { HelpSidebarComponent } from '../help-sidebar/help-sidebar.component';

describe('Help component', () => {
    let component: HelpComponent;
    let fixture: ComponentFixture<HelpComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [],
            imports: [ReactiveFormsModule],
            providers: [
                provideHttpClient(withXhr()),
                provideHttpClientTesting(),
                provideDocsMarkdown(),
                Urls, SubViewStorage, ViewStates,
                PreferencesStore, Preferences,
                ViewSwitchService, DiveSchedules,
                UnitConversion, ReloadDispatcher,
                ApplicationSettingsService,
                provideTestTranslate(), LanguageService
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

describe('Help component OnPush', () => {
    const surfaceIntervalAnchor = 'repetitive-dives-and-surface-interval';
    const table = '| A | B |\n|---|---|\n| 1 | 2 |';

    const flushDocument = (fileName: string, markdown: string) => {
        const http = TestBed.inject(HttpTestingController);
        http.match(r => r.url.endsWith(fileName)).forEach(r => r.flush(markdown));
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            providers: [
                provideHttpClient(withXhr()), provideHttpClientTesting(), provideDocsMarkdown(),
                Urls, SubViewStorage, ViewStates, PreferencesStore, Preferences,
                ViewSwitchService, DiveSchedules, UnitConversion, ReloadDispatcher,
                ApplicationSettingsService, provideTestTranslate(), LanguageService
            ]
        });
    });

    it('renders document loaded asynchronously', async () => {
        const fixture = await renderOnPush(HelpComponent);

        flushDocument('application.md', '# Loaded help title');
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loaded help title');
    });

    it('renders docs html', async () => {
        const fixture = await renderOnPush(HelpComponent);

        flushDocument('application.md', '## Repetitive dives and Surface interval\n\n[toxicity](./diveinfo.md#oxygen-toxicity)');
        await fixture.whenStable();

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector(`h2#${surfaceIntervalAnchor}`)).not.toBeNull();
        expect(element.querySelector('a[href="/help/diveinfo/oxygen-toxicity"]')).not.toBeNull();
    });

    it('scrolls to anchor after document rendered', async () => {
        const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});
        const fixture = await renderOnPush(HelpComponent);
        flushDocument('application.md', '# Application');
        await fixture.whenStable();

        // click the menu item, the same as user does
        const items = fixture.componentInstance.sections.flatMap(s => s.items);
        const index = items.findIndex(i => i.path === 'depths' && i.anchor === surfaceIntervalAnchor);
        const menuItems = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('li.list-group-item > div');
        menuItems[index].click();
        await fixture.whenStable();
        flushDocument('depths.md', '## Repetitive dives and Surface interval');
        await fixture.whenStable();

        const heading = (fixture.nativeElement as HTMLElement).querySelector(`h2#${surfaceIntervalAnchor}`);
        expect(heading).not.toBeNull();
        expect(scrollSpy.mock.contexts).toContain(heading);
    });

    it('does not double render when sidebar and help both render', async () => {
        const help = await renderOnPush(HelpComponent);
        const sidebar = await renderOnPush(HelpSidebarComponent);

        flushDocument('.md', table);
        await help.whenStable();
        await sidebar.whenStable();

        for (const host of [help.nativeElement as HTMLElement, sidebar.nativeElement as HTMLElement]) {
            const tables = host.querySelectorAll('table');
            expect(tables.length).toBe(1);
            expect(tables[0].className).toBe('table table-bordered table-sm');
        }
    });
});
