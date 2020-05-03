import { Injectable } from '@angular/core';
import { Plan, Diver, Dive, Gas, WayPoint, Strategies } from './models';
import { WayPointsService } from './waypoints.service';
import { NitroxCalculator, BuhlmannAlgorithm, Gas as BGas, Options, DepthConverter } from 'scuba-physics';
import { Subject } from 'rxjs';

@Injectable()
export class PlannerService {
  public plan: Plan = new Plan(15, 30, Strategies.ALL);
  public diver: Diver = new Diver(20, 1.4);
  public gas: Gas = new Gas(15, 21, 200);
  public dive: Dive = new Dive();
  private onCalculated = new Subject();
  public calculated = this.onCalculated.asObservable();
  public options = new Options(1, 1, 1.6, 30, true, true);

  private static ascent(wayPoints: WayPoint[]): WayPoint[] {
    // first two are descent and bottom
    return wayPoints.slice(2, wayPoints.length);
  }

  public changeWaterType(isFreshWater: boolean) {
    this.options.isFreshWater = isFreshWater;
    this.updateNoDecoTime();
    this.onCalculated.next();
  }

  private updatePpO2Options() {
    this.options.maxppO2 = this.diver.maxPpO2;
  }

  public get gasMod(): number {
    this.updatePpO2Options();

    let depthConverter = DepthConverter.forSaltWater();
    if (this.options.isFreshWater) {
     depthConverter = DepthConverter.forFreshWater();
    }

    const nitroxCalculator = new NitroxCalculator(depthConverter);
    return nitroxCalculator.mod(this.diver.maxPpO2, this.gas.o2);
  }

  public noDecoTime(): number {
    this.updatePpO2Options();
    const algorithm = new BuhlmannAlgorithm();
    const depth = this.plan.depth;
    const gas = this.gas.toGas();
    const noDecoLimit = algorithm.noDecoLimit(depth, gas, this.options);
    return Math.floor(noDecoLimit);
  }

  public calculate() {
    this.updateNoDecoTime();
    const finalData = WayPointsService.calculateWayPoints(this.plan, this.gas, this.options);
    const ascent = PlannerService.ascent(finalData.wayPoints);

    if (finalData.wayPoints.length > 2) {
      this.dive.maxTime = this.calculateMaxBottomTime();
      this.dive.timeToSurface = this.calculateTimeToSurface(ascent);
      this.dive.rockBottom = this.calculateRockBottom(ascent);
      this.gas.consumed = this.calculateConsumedOnWay(finalData.wayPoints, this.diver.sac);
    }

    this.dive.wayPoints = finalData.wayPoints;
    this.dive.ceilings = finalData.ceilings;
    // even in case thirds rule, the last third is reserve, so we always divide by 2
    this.dive.turnPressure = this.calculateTurnPressure();
    this.dive.turnTime = Math.floor(this.plan.duration / 2);
    this.dive.needsReturn = this.plan.needsReturn;
    this.dive.notEnoughGas = this.gas.endPressure < this.dive.rockBottom;
    this.dive.depthExceeded = this.plan.depth > this.gasMod;
    this.dive.notEnoughTime = this.plan.duration < this.dive.descent.duration;
    this.dive.noDecoExceeded = this.plan.noDecoExceeded;
    this.dive.calculated = true;

    this.onCalculated.next();
  }

  public updateNoDecoTime(): void {
    this.plan.noDecoTime = this.noDecoTime();
  }

  private calculateTurnPressure(): number {
    const consumed = this.gas.consumed / 2;
    return this.gas.startPressure - Math.floor(consumed);
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

    while (this.gas.startPressure - consumed >= rockBottom) {
      duration++;
      testPlan.duration = duration;
      const finalData = WayPointsService.calculateWayPoints(testPlan, this.gas, this.options);
      const ascent = PlannerService.ascent(finalData.wayPoints);
      rockBottom = this.calculateRockBottom(ascent);
      consumed = this.calculateConsumedOnWay(finalData.wayPoints, this.diver.sac);
    }

    return testPlan.duration - 1; // we already passed the correct value
  }

  private calculateRockBottom(ascent: WayPoint[]): number {
    const problemSolving = new WayPoint(2, ascent[0].startDepth, ascent[0].startDepth);
    ascent.unshift(problemSolving);
    const stressSac = this.diver.stressSac;
    const result = this.calculateConsumedOnWay(ascent, stressSac);
    const minimumRockBottom = 30;
    return result > minimumRockBottom ? result : minimumRockBottom;
  }

  private calculateConsumedOnWay(wayPoints: WayPoint[], sac: number): number {
    let result = 0;

    for (const wayPoint of wayPoints) {
      const averagePressure  = wayPoint.averagePressure;
      result += wayPoint.duration * averagePressure * Diver.gasSac(sac, this.gas.size);
    }

    const rounded = Math.ceil(result);
    return rounded;
  }

  private calculateTimeToSurface(ascent: WayPoint[]): number {
    const solutionDuration = 2;
    let ascentDuration = 0;

    for (const wayPoint of ascent) {
      ascentDuration += wayPoint.duration;
    }

    return solutionDuration + ascentDuration;
  }

  public loadFrom(other: PlannerService): void {
    if (!other) {
      return;
    }

    this.plan.loadFrom(other.plan);
    this.diver.loadFrom(other.diver);
    // cant use firstGas from the other, since it doesn't have to be deserialized
    this.gas.loadFrom(other.gas);
  }
}
