import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, Strategies, AppPreferences } from './models';
import { WayPointsService } from './waypoints.service';
import {
    NitroxCalculator, BuhlmannAlgorithm, Options,
    DepthConverter, DepthConverterFactory, Tank, Tanks,
    Diver, SegmentsFactory, Consumption, Segment, Gases, Segments
} from 'scuba-physics';

@Injectable()
export class PlannerService {
    public static readonly maxAcceptableNdl = 1000;
    public isComplex = false;
    public plan: Plan;
    public diver: Diver = new Diver(20, 1.4);
    // there always needs to be at least one
    public dive: Dive = new Dive();
    public calculated;
    private _tanks: Tank[] = [
        Tank.createDefault()
    ];
    private _options = new Options(0.4, 0.85, 1.4, 1.6, 30, true, true);
    private onCalculated = new Subject();
    private depthConverterFactory = new DepthConverterFactory(this.options);
    private depthConverter: DepthConverter = this.depthConverterFactory.create();
    private nitroxCalculator: NitroxCalculator = new NitroxCalculator(this.depthConverter);

    public get options(): Options {
        return this._options;
    }
    public get tanks(): Tank[] {
        return this._tanks;
    }

    /** only for recreational diver use case */
    public get firstTank(): Tank {
        return this._tanks[0];
    }

    public get ndlValid(): boolean {
        return this.dive.calculated && this.plan.noDecoTime < PlannerService.maxAcceptableNdl;
    }

    constructor() {
        this.calculated = this.onCalculated.asObservable();
        this.plan = new Plan(Strategies.ALL, 30, 12, this.firstTank, this.options);
    }

    public resetToSimple(): void {
        this._tanks = this._tanks.slice(0, 1);
        this.plan.setSimple(this.plan.maxDepth, this.plan.duration, this.firstTank, this.options);
    }

    public addTank(): void {
        const newTank = Tank.createDefault();
        newTank.size = 11;
        this._tanks.push(newTank);
        newTank.id = this._tanks.length;
        this.calculate();
    }

    public removeTank(tank: Tank): void {
        this._tanks = Tanks.removeTank(this._tanks, tank);
        this.plan.resetSegments(tank, this.firstTank);
        this.calculate();
    }

    public addSegment(): void {
        this.plan.addSegment(this.firstTank);
        this.calculate();
    }

    public removeSegment(segment: Segment): void {
        this.plan.removeSegment(segment);
        this.calculate();
    }

    public changeWaterType(isFreshWater: boolean): void {
        this.options.isFreshWater = isFreshWater;
        this.calculate();
    }

    public applyMaxDepth(): void {
        this.assignDepth(this.maxNarcDepth);
    }

    public applyMaxDuration(): void {
        const newValue = this.dive.maxTime;
        this.assignDuration(newValue);
    }

    public applyNdlDuration(): void {
        const newValue = this.plan.noDecoTime;
        this.assignDuration(newValue);
    }

    public bestNitroxMix(): number {
        const maxPpO2 = this.options.maxPpO2;
        const o2 = this.nitroxCalculator.bestMix(maxPpO2, this.plan.maxDepth);
        return Math.round(o2);
    }

    public get maxNarcDepth(): number {
        // TODO add UI for maxEND
        const depthInBars = this.depthConverter.toBar(this.options.maxEND);
        const maxNarcBar = this.firstTank.gas.end(depthInBars);
        const maxNarcDepth = this.depthConverter.fromBar(maxNarcBar);
        // because of javascript numbers precision we need to help our self
        const roundedNarc = Math.round(maxNarcDepth * 100) / 100;
        // Narcotic depth it self makes no sense without helium,
        // because its narcotic coefficient is 1 for all Nitrox mixes
        const minFound = Math.min(roundedNarc, this.gasMod);
        return Math.floor(minFound);
    }

    public get gasMod(): number {
        return this.modForGas(this.firstTank);
    }

    public switchDepth(gas: Tank): number {
        return this.nitroxCalculator.gasSwitch(this.diver.maxDecoPpO2, gas.o2);
    }

    public modForGas(gas: Tank): number {
        return this.nitroxCalculator.mod(this.diver.maxPpO2, gas.o2);
    }

    public noDecoTime(): number {
        const algorithm = new BuhlmannAlgorithm();
        // we can't speedup the prediction from already obtained profile,
        // since it may happen, the deco starts during ascent.
        // we cant use the maxDepth, because its purpose is only for single level dives
        const gases = Gases.fromTanks(this._tanks);
        const segments = this.plan.copySegments();
        const noDecoLimit = algorithm.noDecoLimitMultiLevel(segments, gases, this.options);
        return noDecoLimit;
    }

    public assignDuration(newDuration: number): void {
        this.plan.assignDuration(newDuration, this.firstTank, this.options);
        this.calculate();
    }

    public assignDepth(newDepth: number): void {
        this.plan.assignDepth(newDepth, this.firstTank, this.options);
        this.calculate();
    }

    public calculate(): void {
        this.measureMethod('Planner calculate', () => {
            // TODO copy options to diver only on app startup, let it customize per dive
            this.options.maxPpO2 = this.diver.maxPpO2;
            this.options.maxDecoPpO2 = this.diver.maxDecoPpO2;
            this.depthConverter = this.depthConverterFactory.create();
            this.nitroxCalculator = new NitroxCalculator(this.depthConverter);
            const profile = WayPointsService.calculateWayPoints(this.plan, this._tanks, this.options);
            this.dive.wayPoints = profile.wayPoints;
            this.dive.ceilings = profile.ceilings;
            this.dive.events = profile.events;
            this.dive.averageDepth = Segments.averageDepth(profile.origin);
            const userSegments = this.plan.length;

            if (profile.endsOnSurface) {
                const consumption = new Consumption(this.depthConverter);
                this.plan.noDecoTime = this.noDecoTime();

                // Max bottom changes tank consumed bars, so we need it calculate before real profile consumption
                this.measureMethod('Max bottom time', () => {
                    const segments = this.plan.copySegments();
                    this.dive.maxTime = consumption.calculateMaxBottomTime(segments, this._tanks, this.diver, this.options);
                });

                this.measureMethod('Consumption', () => {
                    const originAscent = SegmentsFactory.ascent(profile.origin, userSegments);
                    this.dive.timeToSurface = SegmentsFactory.timeToSurface(originAscent);
                    consumption.consumeFromTanks(profile.origin, userSegments, this._tanks, this.diver);
                    this.dive.notEnoughTime = this.plan.notEnoughTime;
                });
            }

            // even in case thirds rule, the last third is reserve, so we always divide by 2
            this.dive.turnPressure = this.calculateTurnPressure();
            this.dive.turnTime = Math.floor(this.plan.duration / 2);
            // this needs to be moved to each gas or do we have other option?
            this.dive.needsReturn = this.plan.needsReturn && this._tanks.length === 1;
            this.dive.notEnoughGas = !Tanks.haveReserve(this._tanks);
            this.dive.noDecoExceeded = this.plan.noDecoExceeded;
            this.dive.calculated = true;
        });
        this.onCalculated.next();
    }

    public loadFrom(other: AppPreferences): void {
        if (!other) {
            return;
        }

        this.isComplex = other.isComplex;
        this.assignOptions(other.options);
        this.diver.loadFrom(other.diver);
        const newTanks = Tanks.loadTanks(other.tanks);
        if (newTanks.length > 0) {
            this._tanks = newTanks;
        }

        // TODO fix references to tanks from segments
        // New tanks are empty - keep only first tank, reset all segment references to first tank only
        // Multiple new tanks - Set tank reference to first tank in case tank index is now out of range
        this.plan.loadFrom(other.plan);
        this.calculate();
    }

    public toPreferences(): AppPreferences {
        return {
            isComplex: this.isComplex,
            options: this.options,
            diver: this.diver,
            tanks: this._tanks,
            plan: this.plan.copySegments()
        } as AppPreferences;
    }

    private assignOptions(newOptions: Options): void {
        this._options.loadFrom(newOptions);
        this.depthConverterFactory = new DepthConverterFactory(newOptions);
    }

    private measureMethod(message: string, delegate: () => void): void {
        const startTime = performance.now();
        delegate();
        const endTime = performance.now();
        const methodDuration = Math.round(endTime - startTime);
        console.log(message + `: ${methodDuration} ms`);
    }

    private calculateTurnPressure(): number {
        const consumed = this.firstTank.consumed / 2;
        return this.firstTank.startPressure - Math.floor(consumed);
    }
}
