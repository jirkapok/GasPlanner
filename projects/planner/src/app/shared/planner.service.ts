import { Injectable } from '@angular/core';
import { Plan, Diver, Dive, Gas, SafetyStop, WayPoint } from './models';
import { WayPointsService } from './waypoints.service';
import { NitroxCalculator, BuhlmannAlgorithm, Gas as BGas, Options } from 'scuba-physics';
import { Subject } from 'rxjs';

@Injectable()
export class PlannerService {
  public plan: Plan = new Plan(15, 30, 1);
  public diver: Diver = new Diver(20, 1.4);
  public gas: Gas = new Gas(15, 21, 200);
  public dive: Dive = new Dive();
  private onCalculated = new Subject();
  public calculated = this.onCalculated.asObservable();
  private options = new Options(1, 1, 1.6, 30, true, true);

  public get gasMod(): number {
    return NitroxCalculator.mod(this.diver.maxPpO2, this.gas.o2);
  }

  public noDecoTime(): number {
    const algorithm = new BuhlmannAlgorithm();
    const depth = this.plan.depth;
    const gas = this.gas.toGas();
    const noDecoLimit = algorithm.noDecoLimit(depth, gas, this.options);
    return Math.floor(noDecoLimit);
  }

  public calculate() {
    const finalData = WayPointsService.calculateWayPoints(this.plan, this.gas, this.options);
    this.dive.wayPoints = finalData.wayPoints;
    this.dive.ceilings = finalData.ceilings;
    this.dive.timeToSurface = this.calculateTimeToSurface();
    this.dive.rockBottom = this.calculateRockBottom();
    this.dive.maxTime = this.calculateMaxBottomTime();
    this.gas.consumed = this.calculateConsumedOnWay(this.dive.wayPoints, this.diver.sac);

    // even in case thirds rule, the last third is reserve, so we always divide by 2
    this.dive.turnPressure = this.calculateTurnPressure();
    this.dive.turnTime = Math.floor(this.plan.duration / 2);

    this.updateNoDecoTime();

    this.dive.needsReturn = this.plan.needsReturn;
    this.dive.notEnoughGas = this.gas.endPressure < this.dive.rockBottom;
    this.dive.depthExceeded = this.plan.depth > this.gasMod;
    this.dive.notEnoughTime = this.plan.duration <= this.dive.timeToSurface;
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

  private calculateMaxBottomTime(): number {
    const availablePressure = this.availablePressure();
    const gasSac = this.diver.gasSac(this.gas);
    const descent = this.dive.descent;
    const consumedByDescent = descent.duration * gasSac * descent.duration;
    const forBottom = availablePressure - consumedByDescent;
    const bottom = this.dive.bottom;
    const bottomTime = forBottom / bottom.averagePressure / gasSac;
    const result = descent.duration + bottomTime;
    return Math.floor(result);
  }

  private availablePressure(): number {
    const surfacing = this.calculateConsumedOnWay(this.dive.ascent, this.diver.sac);
    const reserve = surfacing + this.dive.rockBottom;
    return (this.gas.startPressure - reserve) * this.plan.availablePressureRatio;
  }

  private calculateRockBottom(): number {
    const ascent = this.dive.ascent;
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

  private calculateTimeToSurface(): number {
    const solutionDuration = 2;
    const safetyStop = this.plan.needsSafetyStop ? SafetyStop.duration : 0;
    const swimTime = Math.ceil(this.plan.depth /  Diver.ascSpeed);
    return solutionDuration + swimTime + safetyStop;
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
