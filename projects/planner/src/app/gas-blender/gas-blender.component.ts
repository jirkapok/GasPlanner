import { Component, OnInit } from '@angular/core';
import { faFaucet, faExclamationTriangle, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import { FormControl, FormGroup, NonNullableFormBuilder } from '@angular/forms';
import { RangeConstants, UnitConversion } from '../shared/UnitConversion';
import { GasBlenderService } from '../shared/gas-blender.service';
import { ValidatorGroups } from '../shared/ValidatorGroups';
import { InputControls } from '../shared/inputcontrols';
import {
    Precision, StandardGases, Tank, GasMixtures
} from 'scuba-physics';
import { BlenderViewState, TankMix } from '../shared/views.model';
import { KnownViews } from '../shared/viewStates';
import { SubViewStorage } from '../shared/subViewStorage';
import { BlendPricingService } from '../shared/blend-pricing.service';

interface IGasBlenderForm {
    sourceO2: FormControl<number>;
    sourceHe: FormControl<number>;
    sourcePressure: FormControl<number>;
    topMixO2: FormControl<number>;
    topMixHe: FormControl<number>;
    targetO2: FormControl<number>;
    targetHe: FormControl<number>;
    targetPressure: FormControl<number>;
    o2UnitPrice: FormControl<number>;
    heUnitPrice: FormControl<number>;
    topMixUnitPrice: FormControl<number>;
}

@Component({
    selector: 'app-gas-blender',
    templateUrl: './gas-blender.component.html',
    styleUrls: ['./gas-blender.component.scss']
})
export class GasBlenderComponent implements OnInit {
    public readonly calcIcon = faFaucet;
    public exclamationIcon = faExclamationTriangle;
    public dollarIcon = faSackDollar;
    public blenderForm!: FormGroup<IGasBlenderForm>;
    public showPricing = false;

    constructor(
        public units: UnitConversion,
        public calc: GasBlenderService,
        public pricing: BlendPricingService,
        private validators: ValidatorGroups,
        private inputs: InputControls,
        private viewStates: SubViewStorage,
        private fb: NonNullableFormBuilder) {
    }

    public get ranges(): RangeConstants {
        return this.units.ranges;
    }

    public get sourceHeInvalid(): boolean {
        const control = this.blenderForm.controls.sourceHe;
        return this.inputs.controlInValid(control);
    }

    public get topMixHeInvalid(): boolean {
        const control = this.blenderForm.controls.topMixHe;
        return this.inputs.controlInValid(control);
    }

    public get targetHeInvalid(): boolean {
        const control = this.blenderForm.controls.targetHe;
        return this.inputs.controlInValid(control);
    }

    // we don't need working pressure for source and target,
    // since don't count with volume only percentage
    public get sourcePressureInvalid(): boolean {
        const control = this.blenderForm.controls.sourcePressure;
        return this.inputs.controlInValid(control);
    }

    public get targetPressureInvalid(): boolean {
        const control = this.blenderForm.controls.targetPressure;
        return this.inputs.controlInValid(control);
    }

    public get o2UnitPriceInvalid(): boolean {
        const control = this.blenderForm.controls.o2UnitPrice;
        return this.inputs.controlInValid(control);
    }

    public get heUnitPriceInvalid(): boolean {
        const control = this.blenderForm.controls.heUnitPrice;
        return this.inputs.controlInValid(control);
    }

    public get topMixUnitPriceInvalid(): boolean {
        const control = this.blenderForm.controls.topMixUnitPrice;
        return this.inputs.controlInValid(control);
    }

    public ngOnInit(): void {
        this.loadState();
        this.saveState();

        // custom range to allow mix to empty tank
        const pressureRange: [number, number] = [0, this.ranges.tankPressure[1]];
        const pressureValidator = this.validators.rangeFor(pressureRange);
        this.blenderForm = this.fb.group({
            sourceO2: [this.calc.sourceTank.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            sourceHe: [this.calc.sourceTank.he, this.validators.rangeFor(this.ranges.tankHe)],
            sourcePressure: [Precision.round(this.calc.sourceTank.startPressure, 1), pressureValidator],
            topMixO2: [this.calc.topMix.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            topMixHe: [this.calc.topMix.he, this.validators.rangeFor(this.ranges.tankHe)],
            targetO2: [this.calc.targetTank.o2, this.validators.rangeFor(this.ranges.trimixOxygen)],
            targetHe: [this.calc.targetTank.he, this.validators.rangeFor(this.ranges.tankHe)],
            targetPressure: [Precision.round(this.calc.targetTank.startPressure, 1), pressureValidator],
            o2UnitPrice: [this.pricing.o2UnitPrice, this.validators.rangeFor(this.ranges.money)],
            heUnitPrice: [this.pricing.heUnitPrice, this.validators.rangeFor(this.ranges.money)],
            topMixUnitPrice: [this.pricing.topMixUnitPrice, this.validators.rangeFor(this.ranges.money)]
        });
    }

    public applyChange(): void {
        if(this.blenderForm.invalid) {
            return;
        }

        const newValue = this.blenderForm.value;
        this.calc.sourceTank.o2 = Number(newValue.sourceO2);
        this.calc.sourceTank.he = Number(newValue.sourceHe);
        this.calc.sourceTank.startPressure = Number(newValue.sourcePressure);
        this.calc.topMix.o2 = Number(newValue.topMixO2);
        this.calc.topMix.he = Number(newValue.topMixHe);
        this.calc.targetTank.o2 = Number(newValue.targetO2);
        this.calc.targetTank.he = Number(newValue.targetHe);
        this.calc.targetTank.startPressure = Number(newValue.targetPressure);
        this.pricing.o2UnitPrice = Number(newValue.o2UnitPrice);
        this.pricing.heUnitPrice = Number(newValue.heUnitPrice);
        this.pricing.topMixUnitPrice = Number(newValue.topMixUnitPrice);

        this.calculate();
        this.saveState();
    }

    public togglePricing(): void {
        this.showPricing = !this.showPricing;
    }

    public applyTemplate(): void {
        if(this.blenderForm.invalid) {
            return;
        }

        this.blenderForm.patchValue({
            sourceO2: this.calc.sourceTank.o2,
            sourceHe: this.calc.sourceTank.he,
            topMixO2: this.calc.topMix.o2,
            topMixHe: this.calc.topMix.he,
            targetO2: this.calc.targetTank.o2,
            targetHe: this.calc.targetTank.he
        });

        this.applyChange();
    }

    private loadState(): void {
        let state: BlenderViewState = this.viewStates.loadView(KnownViews.blender);

        if (!state) {
            state = this.createDefaultState();
        }

        this.applyState(state);
        this.calculate();
    }

    private applyState(state: BlenderViewState) {
        this.loadTankState(this.calc.sourceTank.tank, state.source);
        this.loadTankState(this.calc.targetTank.tank, state.target);
        this.calc.topMix.o2 = state.topMix.o2;
        this.calc.topMix.he = state.topMix.he;

        if(state.prices) { // added in version 0.1.30, does not have to be present
            this.pricing.o2UnitPrice = state.prices.o2UnitPrice;
            this.pricing.heUnitPrice = state.prices.heUnitPrice;
            this.pricing.topMixUnitPrice = state.prices.topMixUnitPrice;
        }
    }

    private saveState(): void {
        const viewState = {
            id: KnownViews.blender,
            source: this.toTankState(this.calc.sourceTank.tank),
            target: this.toTankState(this.calc.targetTank.tank),
            topMix: {
                o2: this.calc.topMix.tank.o2,
                he: this.calc.topMix.tank.he
            },
            prices: {
                o2UnitPrice: this.pricing.o2UnitPrice,
                heUnitPrice: this.pricing.heUnitPrice,
                topMixUnitPrice: this.pricing.topMixUnitPrice
            }
        };

        this.viewStates.saveView(viewState);
    }

    private createDefaultState(): BlenderViewState {
        return {
            id: KnownViews.blender,
            source: {
                o2: GasMixtures.o2InAir * 100,
                he: 0,
                pressure: 0
            },
            target: {
                o2: StandardGases.ean32.fO2 * 100,
                he: 0,
                pressure: 200
            },
            topMix: {
                o2: StandardGases.ean32.fO2 * 100,
                he: 0,
            },
            prices: {
                o2UnitPrice: 0,
                heUnitPrice: 0,
                topMixUnitPrice: 0
            }
        };
    }

    private loadTankState(tank: Tank, state: TankMix): void {
        tank.o2 = state.o2;
        tank.he = state.he;
        tank.startPressure = state.pressure;
    }

    private toTankState(tank: Tank): TankMix {
        return {
            o2: tank.o2,
            he: tank.he,
            pressure: tank.startPressure
        };
    }

    private calculate(): void {
        this.calc.calculate();
        this.pricing.calculate();
    }
}
