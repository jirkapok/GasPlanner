import { Injectable } from '@angular/core';
import { Plan, Diver, Dive, Gas, WayPoint, Strategies } from './models';
import { WayPointsService } from './waypoints.service';
import { NitroxCalculator, BuhlmannAlgorithm, Gas as BGas, Options, DepthConverter, Time } from 'scuba-physics';
import { Subject } from 'rxjs';

@Injectable()
export class PlannerService {
  public isTechnical = false;
  public plan: Plan = new Plan(12, 30, Strategies.ALL);
  public diver: Diver = new Diver(20, 1.4);
  // there always needs to be at least one
  public gases: Gas[];
  public dive: Dive = new Dive();
  private onCalculated = new Subject();
  public calculated = this.onCalculated.asObservable();
  public options = new Options(0.4, 0.85, 1.4, 1.6, 30, true, true);

  // TODO remove
  public get firstGas(): Gas {
    return this.gases[0];
  }

  constructor() {
    this.resetToDefaultGases();
  }

  private static ascent(wayPoints: WayPoint[]): WayPoint[] {
    // first two are descent and bottom
    return wayPoints.slice(2, wayPoints.length);
  }

  public resetToDefaultGases(): void {
    this.gases = [
      new Gas(15, 21, 200)
    ];
  }

  public addGas(): void {
    const newGas = new Gas(11, 21, 200);
    this.gases.push(newGas);
  }

  public removeGas(gas: Gas): void {
    this.gases = this.gases.filter(g => g !== gas);
  }

  public changeWaterType(isFreshWater: boolean) {
    this.options.isFreshWater = isFreshWater;
    this.updateNoDecoTime();
    this.onCalculated.next();
  }

  public get gasMod(): number {
    return this.gasModByPpO2(this.firstGas, this.diver.maxPpO2);
  }

  public modForDecoGas(gas: Gas): number {
    return this.gasModByPpO2(gas, this.diver.maxDecoPpO2);
  }

  public modForGas(gas: Gas): number {
    return this.gasModByPpO2(gas, this.diver.maxPpO2);
  }

  private gasModByPpO2(gas: Gas, ppO2: number): number {
    let depthConverter = DepthConverter.forSaltWater();
    if (this.options.isFreshWater) {
     depthConverter = DepthConverter.forFreshWater();
    }

    const nitroxCalculator = new NitroxCalculator(depthConverter);
    return nitroxCalculator.mod(ppO2, gas.o2);
  }

  public noDecoTime(): number {
    this.options.maxPpO2 = this.diver.maxPpO2;
    this.options.maxDecoPpO2 = this.diver.maxDecoPpO2;
    const algorithm = new BuhlmannAlgorithm();
    const depth = this.plan.depth;
    const gas = this.firstGas.toGas();
    const noDecoLimit = algorithm.noDecoLimit(depth, gas, this.options);
    return Math.floor(noDecoLimit);
  }

  public calculate() {
    this.updateNoDecoTime();
    const profile = WayPointsService.calculateWayPoints(this.plan, this.gases, this.options);
    // TODO multilevel diving: ascent cant be identified by first two segments
    const ascent = PlannerService.ascent(profile.wayPoints);
    this.dive.wayPoints = profile.wayPoints;
    this.dive.ceilings = profile.ceilings;
    this.dive.events = profile.events;

    if (profile.wayPoints.length > 2) {
      this.dive.maxTime = this.calculateMaxBottomTime();
      this.dive.timeToSurface = this.calculateTimeToSurface(ascent);
      this.firstGas.reserve = this.calculateRockBottom(ascent);
      this.firstGas.consumed = this.calculateConsumedOnWay(profile.wayPoints, this.diver.sac);
      this.dive.notEnoughTime = Time.toSeconds(this.plan.duration) < this.dive.descent.duration;
    }

    // even in case thirds rule, the last third is reserve, so we always divide by 2
    this.dive.turnPressure = this.calculateTurnPressure();
    this.dive.turnTime = Math.floor(this.plan.duration / 2);
    this.dive.needsReturn = this.plan.needsReturn;
    this.dive.notEnoughGas = this.firstGas.endPressure < this.firstGas.reserve;
    this.dive.depthExceeded = this.plan.depth > this.gasMod;
    this.dive.noDecoExceeded = this.plan.noDecoExceeded;
    this.dive.calculated = true;

    this.onCalculated.next();
  }

  public updateNoDecoTime(): void {
    this.plan.noDecoTime = this.noDecoTime();
  }

  private calculateTurnPressure(): number {
    const consumed = this.firstGas.consumed / 2;
    return this.firstGas.startPressure - Math.floor(consumed);
  }

  /**
   * We need to repeat the calculation by increasing duration, until there is enough gas
   * because increase of duration means also change in the ascent plan.
   */
  private calculateMaxBottomTime(): number {
    const testPlan = new Plan(1, this.plan.depth, this.plan.strategy);
    let consumed = 0;
    let rockBottom = 0;
    let duration = 0;

    while (this.firstGas.startPressure - consumed >= rockBottom) {
      duration++;
      testPlan.duration = duration;
      const finalData = WayPointsService.calculateWayPoints(testPlan, this.gases, this.options);
      const ascent = PlannerService.ascent(finalData.wayPoints);
      rockBottom = this.calculateRockBottom(ascent);
      consumed = this.calculateConsumedOnWay(finalData.wayPoints, this.diver.sac);
    }

    return testPlan.duration - 1; // we already passed the correct value
  }

  private calculateRockBottom(ascent: WayPoint[]): number {
    const solvingDuration = 2 * Time.oneMinute;
    const problemSolving = new WayPoint(solvingDuration, ascent[0].startDepth, ascent[0].startDepth);
    ascent.unshift(problemSolving);
    const stressSac = this.diver.stressSac;
    const result = this.calculateConsumedOnWay(ascent, stressSac);
    const minimumRockBottom = 30;
    return result > minimumRockBottom ? result : minimumRockBottom;
  }

  private calculateConsumedOnWay(wayPoints: WayPoint[], sac: number): number {
    let result = 0;
    const sacSeconds = Time.toMinutes(sac);

    for (const wayPoint of wayPoints) {
      const averagePressure  = wayPoint.averagePressure;
      result += wayPoint.duration * averagePressure * Diver.gasSac(sacSeconds, this.firstGas.size);
    }

    const rounded = Math.ceil(result);
    return rounded;
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
    this.firstGas.loadFrom(other.firstGas);
  }
}
