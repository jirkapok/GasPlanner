import { Injectable } from '@angular/core';
import { Plan, Diver, Dive, Tank, WayPoint, Strategies } from './models';
import { WayPointsService } from './waypoints.service';
import { NitroxCalculator, BuhlmannAlgorithm, Gas as BGas, Options, DepthConverter, Time, DepthConverterFactory } from 'scuba-physics';
import { Subject } from 'rxjs';

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
  // TODO remove
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
    return Math.floor(o2);
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
    // TODO multilevel diving: ascent cant be identified by first two segments
    const ascent = PlannerService.ascent(profile.wayPoints);
    this.dive.wayPoints = profile.wayPoints;
    this.dive.ceilings = profile.ceilings;
    this.dive.events = profile.events;

    if (profile.wayPoints.length > 2) {
      this.dive.maxTime = this.calculateMaxBottomTime();
      this.dive.timeToSurface = this.calculateTimeToSurface(ascent);
      this.firstTank.reserve = this.calculateRockBottom(ascent);
      this.firstTank.consumed = this.calculateConsumedOnWay(profile.wayPoints, this.diver.sac);
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

  private calculateMaxBottomTime(): number {
    const recreDuration = this.nodecoProfileBottomTime();
    const noDecoSeconds = Time.toSeconds(this.plan.noDecoTime);

    if(recreDuration > noDecoSeconds) {
       return this.estimateMaxDecotime();
    }

    const minutes = Time.toMinutes(recreDuration);
    return Math.floor(minutes);
  }

  private buildNoDecoProfile(): WayPoint[] {
    const safetyStopDepth = DepthConverter.decoStopDistance; // TODO customizable safetystop depth
    const safetyStopDuration = 3 * Time.oneMinute;

    const maxDepth = this.plan.depth;
    const descentDuration = WayPointsService.descentDuration(this.plan, this.options);
    const descent = new WayPoint(descentDuration, maxDepth);
    const swim = new WayPoint(0, maxDepth, maxDepth);
    const ascentDuration = Time.toSeconds((maxDepth - safetyStopDepth) / this.options.ascentSpeed);
    const ascentToSafety = new WayPoint(ascentDuration, safetyStopDepth, maxDepth);
    const safetyStop = new WayPoint(safetyStopDuration, safetyStopDepth, safetyStopDepth);
    const lastAscent = Time.toSeconds(safetyStopDepth / this.options.ascentSpeed);
    const toSurface = new WayPoint(lastAscent, 0, safetyStopDepth);
    let recreProfile: WayPoint[] = [descent, swim, ascentToSafety, safetyStop, toSurface];
    return recreProfile;
  }

  private nodecoProfileBottomTime(): number {
    const recreProfile = this.buildNoDecoProfile();
    let ascent = PlannerService.ascent(recreProfile);
    let rockBottom = this.calculateRockBottom(ascent);
    let consumed = this.calculateConsumedOnWay(recreProfile, this.diver.sac);
    const remaining = this.firstTank.startPressure - consumed - rockBottom;

    if(remaining > 0) {
      const sacSeconds = Time.toMinutes(this.diver.sac);
      const bottomConumption = this.waipointConsumptionPerSecond(recreProfile[1], sacSeconds);
      const swimDuration = remaining / bottomConumption;
      const recreDuration = recreProfile[0].duration + swimDuration;
      return recreDuration;
    }

    return recreProfile[0].duration; // descent only
  }
  
  /**
   * We need to repeat the calculation by increasing duration, until there is enough gas
   * because increase of duration means also change in the ascent plan.
   * This method is performance hit, since it needs to calculate the profile.
   */
  private estimateMaxDecotime(): number {
    const maxRecreTime = this.plan.noDecoTime;
    const testPlan = new Plan(maxRecreTime, this.plan.depth, this.plan.strategy);
    let consumed = 0;
    let rockBottom = 0;

    while (this.hasEnougGas(consumed, rockBottom)) {
      testPlan.duration++;
      const profile = WayPointsService.calculateWayPoints(testPlan, this.tanks, this.options);
      const ascent = PlannerService.ascent(profile.wayPoints);
      rockBottom = this.calculateRockBottom(ascent);
      consumed = this.calculateConsumedOnWay(profile.wayPoints, this.diver.sac);
    }

    return testPlan.duration - 1; // we already passed the way
  }
  
  private hasEnougGas(consumed: number, rockBottom: number): boolean {
    return this.firstTank.startPressure - consumed >= rockBottom;
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
      result += wayPoint.duration * this.waipointConsumptionPerSecond(wayPoint, sacSeconds);
    }

    const rounded = Math.ceil(result);
    return rounded;
  }

  /** bar/second */
  private waipointConsumptionPerSecond(wayPoint: WayPoint, sacSeconds: number): number {
    const averagePressure = this.depthConverter.toBar(wayPoint.averageDepth);
    const consumed = averagePressure * Diver.gasSac(sacSeconds, this.firstTank.size);
    return consumed;
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
