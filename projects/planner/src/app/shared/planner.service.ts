import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, Strategies } from './models';
import { WayPointsService } from './waypoints.service';
import { NitroxCalculator, BuhlmannAlgorithm, Options,
    DepthConverter, Time, DepthConverterFactory, Tank, Diver,
    SegmentsFactory, Consumption, Gas} from 'scuba-physics';

@Injectable()
export class PlannerService {
    public isComplex = false;
    public plan: Plan;
    public diver: Diver = new Diver(20, 1.4);
    // there always needs to be at least one
    public tanks: Tank[] = [
        Tank.createDefault()
    ];
    public dive: Dive = new Dive();
    public calculated;
    public options = new Options(0.4, 0.85, 1.4, 1.6, 30, true, true);
    private onCalculated = new Subject();
    private depthConverterFactory = new DepthConverterFactory(this.options);
    private depthConverter: DepthConverter = this.depthConverterFactory.create();
    private nitroxCalculator: NitroxCalculator = new NitroxCalculator(this.depthConverter);

    /** only for recreational diver use case */
    public get firstTank(): Tank {
        return this.tanks[0];
    }

    private get firstGas(): Gas {
        return this.firstTank.gas;
    }

    constructor() {
        this.calculated = this.onCalculated.asObservable();
        this.plan = new Plan(Strategies.ALL, 30, 12, this.firstGas, this.options);
    }

    public resetToSimple(): void {
        this.tanks = this.tanks.slice(0, 1);
        this.plan.reset(this.plan.maxDepth, this.plan.duration, this.firstGas, this.options);
    }

    public addGas(): void {
        const newTank = Tank.createDefault();
        newTank.size = 11;
        this.tanks.push(newTank);
        this.calculate();
    }

    public addSegment(targetDepth: number, duration: number): void {
        this.plan.addSegment(targetDepth, this.firstGas, duration);
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
        const maxPpO2 = this.options.maxPpO2;
        const o2 = this.nitroxCalculator.bestMix(maxPpO2, this.plan.maxDepth);
        return Math.round(o2);
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
        this.options.maxPpO2 = this.diver.maxPpO2;
        this.options.maxDecoPpO2 = this.diver.maxDecoPpO2;
        const algorithm = new BuhlmannAlgorithm();
        const depth = this.plan.maxDepth;
        const noDecoLimit = algorithm.noDecoLimit(depth, this.firstGas, this.options);
        return Math.floor(noDecoLimit);
    }

    public assignDuration(newDuration: number): void {
        this.plan.assignDuration(newDuration, this.firstGas, this.options);
        this.calculate();
    }

    public assignDepth(newDepth: number): void {
        this.plan.assignDepth(newDepth, this.firstGas, this.options);
        this.calculate();
    }

    public calculate(): void {
        this.depthConverter = this.depthConverterFactory.create();
        this.nitroxCalculator = new NitroxCalculator(this.depthConverter);
        this.plan.noDecoTime = this.noDecoTime();
        const profile = WayPointsService.calculateWayPoints(this.plan, this.tanks, this.options);
        this.dive.wayPoints = profile.wayPoints;
        this.dive.ceilings = profile.ceilings;
        this.dive.events = profile.events;

        if (profile.wayPoints.length > 2) {
            const consumption = new Consumption(this.depthConverter);

            this.dive.maxTime = consumption.calculateMaxBottomTime(this.plan.maxDepth, this.tanks,
                this.diver, this.options, this.plan.noDecoTime);

            // TODO multilevel diving: ascent cant be identified by first two segments
            const originAscent = SegmentsFactory.ascent(profile.origin);
            this.dive.timeToSurface = SegmentsFactory.timeToSurface(originAscent);
            consumption.consumeFromTanks(profile.origin, this.tanks, this.diver);
            this.dive.notEnoughTime = Time.toSeconds(this.plan.duration) < this.dive.descent.duration;
        }

        // even in case thirds rule, the last third is reserve, so we always divide by 2
        this.dive.turnPressure = this.calculateTurnPressure();
        this.dive.turnTime = Math.floor(this.plan.duration / 2);
        // this needs to be moved to each gas or do we have other option?
        this.dive.needsReturn = this.plan.needsReturn && this.tanks.length === 1;
        this.dive.notEnoughGas = !Consumption.haveReserve(this.tanks);
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
}
