import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint, SwimAction } from '../shared/models';
import { faArrowDown, faArrowUp, faArrowRight, faTasks, faRandom, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { Time } from 'scuba-physics';

@Component({
  selector: 'app-waypoints',
  templateUrl: './waypoints.component.html',
  styleUrls: ['./waypoints.component.css']
})
export class WayPointsComponent implements OnInit {
  public dive: Dive;
  public down = faArrowDown;
  public up = faArrowUp;
  public hover = faArrowRight;
  public tasks = faTasks;
  public switch = faRandom;

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
  }

  public swimActionIcon(point: WayPoint): IconDefinition {
    switch (point.swimAction) {
      case SwimAction.ascent: return this.up;
      case SwimAction.descent: return this.down;
      case SwimAction.switch: return this.switch;
      default: return this.hover;
    }
  }

  public iconTitle(point: WayPoint): String {
    switch (point.swimAction) {
      case SwimAction.ascent:
        return 'ascent';
      case SwimAction.descent:
        return 'descent';
      case SwimAction.switch:
        return 'switch';
      default:
        return 'hover';
    }
  }

  public durationToString(seconds: number): Date {
    return  Time.toDate(seconds);
  }

  public iconClasses(point: WayPoint): any {
    const classes = {
      'mr-3': true,
      'swim-down': point.swimAction === SwimAction.descent,
      'swim-up': point.swimAction === SwimAction.ascent,
      'swim-hover': point.swimAction === SwimAction.hover || point.swimAction === SwimAction.switch,
    };

    return classes;
  }


  private selectTimeFormat(): string {
    if (this.dive.hasHoursRuntime) {
       return 'H:m:ss';
    }

    return 'm:ss';
  }
}
