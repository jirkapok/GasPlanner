import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MainMenuComponent } from './mainmenu.component';
import { ManagedDiveSchedules } from '../shared/managedDiveSchedules';
import { ShareDiveService } from '../shared/ShareDiveService';
import { PreferencesStore } from '../shared/preferencesStore';
import { LanguageService } from '../shared/language.service';
import { Urls } from '../shared/navigation.service';
import { provideTestTranslate } from '../../testing/translate-testing.helpers';
import { LayoutService } from '../shared/layout.service';
import { createSpyObj } from '../../testing/spy-testing.helpers';
import { Mocked } from 'vitest';

describe('Main menu component', () => {
    let fixture: ComponentFixture<MainMenuComponent>;
    let schedules: Mocked<ManagedDiveSchedules>;

    const clickItem = (id: string) => {
        const toggle = fixture.debugElement.query(By.css('#dive')).nativeElement as HTMLElement;
        toggle.click();
        fixture.detectChanges();
        const item = fixture.debugElement.query(By.css(id)).nativeElement as HTMLElement;
        item.click();
    };

    beforeEach(async () => {
        schedules = createSpyObj<ManagedDiveSchedules>(
            ['cloneSelected', 'cloneSelectedDeeper', 'cloneSelectedLonger', 'cloneSelectedDeeperAndLonger']);

        await TestBed.configureTestingModule({
            imports: [MainMenuComponent],
            providers: [
                provideRouter([]),
                provideTestTranslate(), provideNoopAnimations(),
                LanguageService,
                LayoutService,
                Urls,
                { provide: ManagedDiveSchedules, useValue: schedules },
                { provide: ShareDiveService, useValue: createSpyObj<ShareDiveService>(['sharePlan']) },
                { provide: PreferencesStore, useValue: createSpyObj<PreferencesStore>(['save']) }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MainMenuComponent);
        fixture.componentInstance.inPlanner = true;
        fixture.detectChanges();
    });

    it('sets LayoutService\'s mainMenuHeight correctly', () => {
        const layout = TestBed.inject(LayoutService);

        const componentHeight = fixture.nativeElement.getBoundingClientRect().height;

        expect(layout.mainMenuHeight).toBe(componentHeight);
    });

    describe('Dive menu', () => {
        it('+5 m clones deeper dive', () => {
            clickItem('#menuCloneDeeper');
            expect(schedules.cloneSelectedDeeper).toHaveBeenCalledTimes(1);
        });

        it('+5 min clones longer dive', () => {
            clickItem('#menuCloneLonger');
            expect(schedules.cloneSelectedLonger).toHaveBeenCalledTimes(1);
        });

        it('+5 min, +5 m clones deeper and longer dive', () => {
            clickItem('#menuCloneDeeperAndLonger');
            expect(schedules.cloneSelectedDeeperAndLonger).toHaveBeenCalledTimes(1);
        });
    });
});
