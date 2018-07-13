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
    this.planner.loadFrom(loaded);
  }

  public saveDefaults(): void {
    const serialized = JSON.stringify(this.planner);
    localStorage.setItem(this.storageKey, serialized);
  }
}
