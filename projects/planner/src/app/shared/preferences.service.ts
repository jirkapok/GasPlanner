import { Injectable } from '@angular/core';
import { PlannerService } from './planner.service';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private static readonly disclaimerValue = 'confirmed';
  private static readonly storageKey = 'preferences';
  private static readonly disclaimerKey = 'disclaimer';

  constructor(private planner: PlannerService) { }

  public loadDefaults(): void {
    const toParse = localStorage.getItem(PreferencesService.storageKey);
    if (!toParse) {
      return;
    }

    const loaded = JSON.parse(toParse);
    this.planner.loadFrom(loaded);
  }

  public saveDefaults(): void {
    const serialized = JSON.stringify(this.planner);
    localStorage.setItem(PreferencesService.storageKey, serialized);
  }

  public disableDisclaimer(): void {
    localStorage.setItem(PreferencesService.disclaimerKey, PreferencesService.disclaimerValue);
  }

  public disclaimerEnabled(): boolean {
    const saved = localStorage.getItem(PreferencesService.disclaimerKey);
    return saved !== PreferencesService.disclaimerValue;
  }
}
