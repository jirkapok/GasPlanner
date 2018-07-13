import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private storageKey = 'preferences';

  constructor(private planner: PlannerService) { }

  public loadDefaults(): void {
    const toParse = localStorage.getItem(this.storageKey);
    if (!toParse) {
      return;
    }

    const loaded = JSON.parse(toParse);
    this.planner.diver.sac = loaded.diver.sac;
    this.planner.gases.current[0].size = loaded.gases.current[0].size;
    this.planner.gases.current[0].startPressure = loaded.gases.current[0].startPressure;
    this.planner.gases.current[0].o2 = loaded.gases.current[0].o2;
    this.planner.plan.depth = loaded.plan.depth;
    this.planner.plan.duration = loaded.plan.duration;
  }

  public saveDefaults(): void {
    const serialized = JSON.stringify(this.planner);
    localStorage.setItem(this.storageKey, serialized);
  }
}
