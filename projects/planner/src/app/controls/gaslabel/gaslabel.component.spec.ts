import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Tank } from 'scuba-physics';
import { UnitConversion } from '../../shared/UnitConversion';
import { TankBound } from '../../shared/models';
import { GaslabelComponent } from './gaslabel.component';
import { provideTestTranslate } from '../../../testing/translate-testing.helpers';
import { renderOnPush } from '../../../testing/onPush.testing';
import { LanguageService } from '../../shared/language.service';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { TanksService } from '../../shared/tanks.service';
import { DiveSchedule } from '../../shared/dive.schedules';

describe('Gas label component', () => {
    let component: GaslabelComponent;
    let fixture: ComponentFixture<GaslabelComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [ UnitConversion, provideTestTranslate(), LanguageService ]
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(GaslabelComponent);
        component = fixture.componentInstance;
        // switched in shared settings, not on the component, to verify the units are not component scoped
        TestBed.inject(UnitConversion).imperialUnits = true;
        fixture.detectChanges();
    });

    describe('Imperial units', () => {
        it('Adjust mod', () => {
            expect(component.gasMod).toBeCloseTo(185, 5);
        });

        it('Adjust deco mod', () => {
            expect(component.gasDecoMod).toBeCloseTo(216, 5);
        });

        it('Adjust mnd', () => {
            expect(component.gasMnd).toBeCloseTo(98, 5);
        });
    });
});

describe('Gas label component OnPush', () => {
    it('renders gas changed outside Angular events', async () => {
        const units = new UnitConversion();
        TestBed.configureTestingModule({
            providers: [{ provide: UnitConversion, useValue: units }, provideTestTranslate(), LanguageService]
        });
        const tank = new TankBound(Tank.createDefault(), units);
        const fixture = await renderOnPush(GaslabelComponent, { tank });
        const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;
        expect(text()).toContain('Air');

        tank.o2 = 50;
        await fixture.whenStable();

        expect(text()).toContain('EAN50');
    });
});

describe('Gas label component shared tank', () => {
    const units = new UnitConversion();
    const dispatcher = new ReloadDispatcher();

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: UnitConversion, useValue: units }, provideTestTranslate(), LanguageService]
        });
    });

    it('renders gas of first tank reset to simple view', async () => {
        const tanks = new TanksService(units, dispatcher);
        tanks.firstTank.o2 = 18;
        tanks.firstTank.he = 45;
        const fixture = await renderOnPush(GaslabelComponent, { tank: tanks.firstTank });
        const text = (): string | null => (fixture.nativeElement as HTMLElement).textContent;
        expect(text()).toContain('gaslabel.mnd');

        tanks.resetToSimple();
        await fixture.whenStable();

        expect(text()).not.toContain('gaslabel.mnd');
    });

    it('renders gas of first tank applied from nitrox calculator', async () => {
        const dive = new DiveSchedule(0, units, dispatcher);
        const fixture = await renderOnPush(GaslabelComponent, { tank: dive.tanksService.firstTank });

        dive.applyNitrox(50, 1.4);
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).textContent).toContain('EAN50');
    });
});
