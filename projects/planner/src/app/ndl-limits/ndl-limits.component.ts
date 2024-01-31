import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { faTable, faCog } from '@fortawesome/free-solid-svg-icons';
import { Options, Salinity, Tank, GasToxicity } from 'scuba-physics';
import { NdlLimit, NdlService } from '../shared/ndl.service';
import { Gradients } from '../shared/standard-gradients.service';
import { UnitConversion } from '../shared/UnitConversion';
import { TankBound } from '../shared/models';
import { NdlViewState } from '../shared/views.model';
import { SubViewStorage } from '../shared/subViewStorage';
import { KnownViews } from '../shared/viewStates';
import { DiveSchedules } from '../shared/dive.schedules';

@Component({
    selector: 'app-ndl-limits',
    templateUrl: './ndl-limits.component.html',
    styleUrls: ['./ndl-limits.component.scss']
})
export class NdlLimitsComponent implements OnInit {
    public icon = faTable;
    public iconConfig = faCog;
    public tank: TankBound;
    public options: Options;
    public isComplex = false;
    public limits: NdlLimit[] = [];
    public toxicity: GasToxicity;

    constructor(
        public units: UnitConversion,
        public location: Location,
        private ndl: NdlService,
        private viewStates: SubViewStorage,
        schedules: DiveSchedules) {
        this.tank = new TankBound(Tank.createDefault(), this.units);
        const defaultTanks = this.units.defaults.tanks;
        // size of the tank is irrelevant in this view
        this.tank.workingPressure = defaultTanks.primary.workingPressure;
        this.tank.size = defaultTanks.primary.size;
        this.options = new Options();
        const originOptions = schedules.selectedOptions.getOptions();
        this.options.loadFrom(originOptions);
        this.toxicity = new GasToxicity(this.options);
    }

    public get noResults(): boolean {
        return this.limits.length === 0;
    }

    public ngOnInit(): void {
        this.loadState();
        this.calculate();
    }

    // TODO prevent calculation, if any control isn't valid
    public calculate(): void {
        this.limits = this.ndl.calculate(this.tank.tank.gas, this.options);
        const indexOffset = 4; // 4 times the minimum 3 m depth (= 12 m)

        for (let index = 0; index < this.limits.length; index++) {
            // convert meters to target unit
            const limit = this.limits[index];
            limit.depth = this.units.defaults.stopsDistance * (index + indexOffset);
        }

        this.saveState();
    }

    public ppO2Changed(newValue: number): void {
        this.options.maxPpO2 = newValue;
        this.calculate();
    }

    public salinityChanged(newValue: Salinity): void {
        this.options.salinity = newValue;
        this.calculate();
    }

    public altitudeChanged(newValue: number): void {
        this.options.altitude = newValue;
        this.calculate();
    }

    public gradientsChanged(gf: Gradients): void {
        this.options.gfLow = gf.gfLow;
        this.options.gfHigh = gf.gfHeigh;
        this.calculate();
    }

    private loadState(): void {
        let state: NdlViewState = this.viewStates.loadView(KnownViews.ndl);

        if (!state) {
            state = this.createState();
        }

        this.tank.o2 = state.fO2;
        this.options.maxPpO2 = state.pO2;
        this.options.altitude = state.altitude;
        this.options.salinity = state.salinity;
        this.options.gfLow = state.gfLow;
        this.options.gfHigh = state.gfHigh;
    }

    private saveState(): void {
        const viewState = this.createState();
        this.viewStates.saveView(viewState);
    }

    private createState(): NdlViewState {
        return {
            fO2: this.tank.o2,
            pO2: this.options.maxPpO2,
            altitude: this.options.altitude,
            salinity: this.options.salinity,
            gfLow: this.options.gfLow,
            gfHigh: this.options.gfHigh,
            id: KnownViews.ndl
        };
    }
}
