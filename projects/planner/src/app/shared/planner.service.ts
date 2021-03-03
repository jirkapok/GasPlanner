import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Plan, Dive, WayPoint, Strategies } from './models';
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
  public tanks: Tank[];
  public dive: Dive = new Dive();
  private onCalculated = new Subject();
  public calculated = this.onCalculated.asObservable();
  public options = new Options(0.4, 0.85, 1.4, 1.6, 30, true, true);
  private depthConverterFactory = new DepthConverterFactory(this.options);
  private depthConverter: DepthConverter;

  /** only for recreational diver use case */
  public get firstTank(): Tank {
    return this.tanks[0];
  }

  constructor() {
    this.resetToDefaultGases();
  }

  private static ascent(wayPoints: WayPoint[]): WayPoint[] {
    // first two are descent and bottom
    return wayPoints.slice(2, wayPoints.length);
  }

  public resetToDefaultGases(): void {
    this.tanks = [
      new Tank(15, 200, 21)
    ];
  }

  public addGas(): void {
    const newGas = new Tank(11, 200, 21);
    this.tanks.push(newGas);
    this.calculate();
  }

  public removeGas(gas: Tank): void {
    this.tanks = this.tanks.filter(g => g !== gas);
    this.calculate();
  }

  public changeWaterType(isFreshWater: boolean) {
    this.options.isFreshWater = isFreshWater;
    this.calculate();
    this.onCalculated.next();
  }

  public bestNitroxMix(): number {
    const calculator = this.createNitroxCalculator();
    const maxPpO2 = this.options.maxPpO2;
    let o2 = calculator.bestMix(maxPpO2, this.plan.depth);
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

  private createNitroxCalculator(): NitroxCalculator {
    let depthConverter = this.depthConverterFactory.create();
    return new NitroxCalculator(depthConverter);
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
      this.dive.maxTime = consumption.calculateMaxBottomTime(this.plan.depth, this.firstTank, this.diver, this.options, this.plan.noDecoTime);

      // TODO multilevel diving: ascent cant be identified by first two segments
      const ascent = PlannerService.ascent(profile.wayPoints);
      this.dive.timeToSurface = this.calculateTimeToSurface(ascent);

      const originAscent = Consumption.ascent(profile.origin);
      this.firstTank.reserve = consumption.calculateRockBottom(originAscent, this.firstTank, this.diver);
      this.firstTank.consumed = consumption.consumedOnWay(profile.origin, this.firstTank, this.diver.sac);
      this.dive.notEnoughTime = Time.toSeconds(this.plan.duration) < this.dive.descent.duration;
    }

    // even in case thirds rule, the last third is reserve, so we always divide by 2
    this.dive.turnPressure = this.calculateTurnPressure();
    this.dive.turnTime = Math.floor(this.plan.duration / 2);
    this.dive.needsReturn = this.plan.needsReturn;
    this.dive.notEnoughGas = this.firstTank.endPressure < this.firstTank.reserve;
    this.dive.depthExceeded = this.plan.depth > this.gasMod;
    this.dive.noDecoExceeded = this.plan.noDecoExceeded;
    this.dive.calculated = true;

    this.onCalculated.next();
  }

  private calculateTurnPressure(): number {
    const consumed = this.firstTank.consumed / 2;
    return this.firstTank.startPressure - Math.floor(consumed);
  }
  
  private calculateTimeToSurface(ascent: WayPoint[]): number {
    const solutionDuration = 2 * Time.oneMinute;
    let ascentDuration = 0;

    for (const wayPoint of ascent) {
      ascentDuration += wayPoint.duration;
    }

    const seconds = solutionDuration + ascentDuration;
    return Time.toMinutes(seconds);
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
}
