import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, Strategies } from './models';
import { WayPointsService } from './waypoints.service';
import { NitroxCalculator, BuhlmannAlgorithm, Options,
    DepthConverter, Time, DepthConverterFactory, Tank, Diver,
    SegmentsFactory, Consumption} from 'scuba-physics';

@Injectable()
export class PlannerService {
    public isTechnical = false;
    public plan: Plan = new Plan(12, 30, Strategies.ALL);
    public diver: Diver = new Diver(20, 1.4);
    // there always needs to be at least one
    public tanks: Tank[] = [];
    public dive: Dive = new Dive();
    public calculated;
    public options = new Options(0.4, 0.85, 1.4, 1.6, 30, true, true);
    private onCalculated = new Subject();
    private depthConverterFactory = new DepthConverterFactory(this.options);
    private depthConverter: DepthConverter = this.depthConverterFactory.create();

    /** only for recreational diver use case */
    public get firstTank(): Tank {
        return this.tanks[0];
    }

    constructor() {
        this.calculated = this.onCalculated.asObservable();
        this.resetToDefaultGases();
    }

    public resetToDefaultGases(): void {
        this.tanks = [
            Tank.createDefault()
        ];
    }

    public addGas(): void {
        const newTank = Tank.createDefault();
        newTank.size = 11;
        this.tanks.push(newTank);
        this.calculate();
    }

    public removeGas(gas: Tank): void {
        this.tanks = this.tanks.filter(g => g !== gas);
        this.calculate();
    }

    public changeWaterType(isFreshWater: boolean): void {
        this.options.isFreshWater = isFreshWater;
        this.calculate();
        this.onCalculated.next();
    }

    public bestNitroxMix(): number {
        const calculator = this.createNitroxCalculator();
        const maxPpO2 = this.options.maxPpO2;
        const o2 = calculator.bestMix(maxPpO2, this.plan.depth);
        return Math.round(o2);
    }

    public get gasMod(): number {
        return this.modForGas(this.firstTank);
    }

    public switchDepth(gas: Tank): number {
        const nitroxCalculator = this.createNitroxCalculator();
        return nitroxCalculator.gasSwitch(this.diver.maxDecoPpO2, gas.o2);
    }

    public modForGas(gas: Tank): number {
        const nitroxCalculator = this.createNitroxCalculator();
        return nitroxCalculator.mod(this.diver.maxPpO2, gas.o2);
    }

    public noDecoTime(): number {
        this.options.maxPpO2 = this.diver.maxPpO2;
        this.options.maxDecoPpO2 = this.diver.maxDecoPpO2;
        const algorithm = new BuhlmannAlgorithm();
        const depth = this.plan.depth;
        const gas = this.firstTank.gas;
        const noDecoLimit = algorithm.noDecoLimit(depth, gas, this.options);
        return Math.floor(noDecoLimit);
    }

    public calculate(): void {
        this.depthConverter = this.depthConverterFactory.create();
        this.plan.noDecoTime = this.noDecoTime();
        const profile = WayPointsService.calculateWayPoints(this.plan, this.tanks, this.options);
        this.dive.wayPoints = profile.wayPoints;
        this.dive.ceilings = profile.ceilings;
        this.dive.events = profile.events;

        if (profile.wayPoints.length > 2) {
            const consumption = new Consumption(this.depthConverter);

            this.dive.maxTime = consumption.calculateMaxBottomTime(this.plan.depth, this.firstTank,
                this.diver, this.options, this.plan.noDecoTime);

            // TODO multilevel diving: ascent cant be identified by first two segments
            const originAscent = SegmentsFactory.ascent(profile.origin);
            this.dive.timeToSurface = SegmentsFactory.timeToSurface(originAscent);
            consumption.consumeFromTanks(profile.origin, this.tanks, this.diver);
            this.dive.notEnoughTime = Time.toSeconds(this.plan.duration) < this.dive.descent.duration;
        }

        // TODO show next two values only in case one tank defined
        // even in case thirds rule, the last third is reserve, so we always divide by 2
        this.dive.turnPressure = this.calculateTurnPressure();
        this.dive.turnTime = Math.floor(this.plan.duration / 2);
        this.dive.needsReturn = this.plan.needsReturn;
        // TODO all tanks end pressure needs to be higher or equal to reserve
        this.dive.notEnoughGas = this.firstTank.endPressure < this.firstTank.reserve;
        this.dive.depthExceeded = this.plan.depth > this.gasMod;
        this.dive.noDecoExceeded = this.plan.noDecoExceeded;
        this.dive.calculated = true;

        this.onCalculated.next();
    }

    public loadFrom(other: PlannerService): void {
        if (!other) {
            return;
        }

        this.plan.loadFrom(other.plan);
        this.diver.loadFrom(other.diver);
        // cant use firstGas from the other, since it doesn't have to be deserialized
        if(other.tanks.length > 0) {
            this.firstTank.loadFrom(other.tanks[0]);
        }
    }

    private calculateTurnPressure(): number {
        const consumed = this.firstTank.consumed / 2;
        return this.firstTank.startPressure - Math.floor(consumed);
    }

    private createNitroxCalculator(): NitroxCalculator {
        const depthConverter = this.depthConverterFactory.create();
        return new NitroxCalculator(depthConverter);
    }
}
