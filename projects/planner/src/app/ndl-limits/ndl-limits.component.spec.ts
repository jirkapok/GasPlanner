import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Salinity } from 'scuba-physics';
import { NdlService } from '../shared/ndl.service';
import { OptionsService } from '../shared/options.service';
import { UnitConversion } from '../shared/UnitConversion';
import { NdlLimitsComponent } from './ndl-limits.component';
import { SubViewStorage } from '../shared/subViewStorage';
import { ViewStates } from '../shared/viewStates';
import { PreferencesStore } from '../shared/preferencesStore';
import { Preferences } from '../shared/preferences';
import { PlannerService } from '../shared/planner.service';
import { WorkersFactoryCommon } from '../shared/serial.workers.factory';
import { TanksService } from '../shared/tanks.service';
import { WayPointsService } from '../shared/waypoints.service';
import { ViewSwitchService } from '../shared/viewSwitchService';
import { DiveResults } from '../shared/diveresults';
import {DepthsService} from '../shared/depths.service';
import {ReloadDispatcher} from '../shared/reloadDispatcher';

describe('NdlLimits component', () => {
    let component: NdlLimitsComponent;
    let fixture: ComponentFixture<NdlLimitsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [NdlLimitsComponent],
            providers: [
                FormsModule, UnitConversion,
                NdlService, OptionsService, PlannerService,
                SubViewStorage, ViewStates, DiveResults,
                PreferencesStore, Preferences,
                WorkersFactoryCommon, TanksService,
                WayPointsService, ViewSwitchService,
                DepthsService, ReloadDispatcher
            ],
            imports: [RouterTestingModule.withRoutes([])]
        })
            .compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NdlLimitsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('Default values are copied', inject([OptionsService],
        (options: OptionsService) => {
            options.altitude = 200;
            options.gfLow = 0.2;
            options.gfHigh = 0.9;
            options.salinity = Salinity.brackish;
            options.maxPpO2 = 1.1;

            // needs to be created after options applied
            const sut = TestBed.createComponent(NdlLimitsComponent)
                .componentInstance
                .options;
            expect(sut.altitude).toBe(200);
            expect(sut.gfLow).toBe(0.2);
            expect(sut.gfHigh).toBe(0.9);
            expect(sut.salinity).toBe(Salinity.brackish);
            expect(sut.maxPpO2).toBe(1.1);
        }));


    it('Changing values doesn\'t affect main options', inject([OptionsService],
        (sut: OptionsService) => {
            const options = component.options;
            options.altitude = 200;
            options.gfLow = 0.2;
            options.gfHigh = 0.9;
            options.salinity = Salinity.brackish;
            options.maxPpO2 = 1.1;

            expect(sut.altitude).toBe(0);
            expect(sut.gfLow).toBe(0.4);
            expect(sut.gfHigh).toBe(0.85);
            expect(sut.salinity).toBe(Salinity.fresh);
            expect(sut.maxPpO2).toBe(1.4);
        }));

    describe('Imperial units', () => {
        it('Adjusts calculated depths to feet', inject([UnitConversion],
            (units: UnitConversion) => {
                units.imperialUnits = true;
                component.calculate();
                expect(component.limits[0].depth).toBe(40);
            }));

        it('Uses default tank size', inject(
            [Location, NdlService, OptionsService, SubViewStorage],
            (location: Location, ndlService: NdlService, options: OptionsService, views: SubViewStorage) => {
                const units = new UnitConversion();
                units.imperialUnits = true;
                const sut = new NdlLimitsComponent(units, ndlService, options, location, views);
                expect(sut.tank.size).toBe(124.1);
            }));
    });

    it('Change of max ppO2 causes mod for limits', () => {
        component.options.maxPpO2 = 1;
        component.calculate();
        const lastIndex = component.limits.length - 1;
        expect(component.limits[lastIndex].depth).toBe(36);
    });

    it('No limits found', () => {
        component.tank.o2 = 100;
        component.calculate();
        expect(component.noResults).toBeTruthy();
    });
});
