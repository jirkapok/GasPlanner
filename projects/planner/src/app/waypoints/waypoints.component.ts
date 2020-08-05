import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint, SwimDirection } from '../shared/models';
import { faArrowDown, faArrowUp, faArrowRight, faTasks, IconDefinition } from '@fortawesome/free-solid-svg-icons';
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

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
  }

  public swimDirectionIcon(point: WayPoint): IconDefinition {
    switch (point.swimDirection) {
      case SwimDirection.ascent: return this.up;
      case SwimDirection.descent: return this.down;
      default: return this.hover;
    }
  }

  public iconTitle(point: WayPoint): String {
    switch (point.swimDirection) {
      case SwimDirection.ascent:
        return 'ascent';
      case SwimDirection.descent:
        return 'descent';
      default:
        return 'hover';
    }
  }

  public durationToString(timeStamp: number): String {
    const minutes = Math.floor(timeStamp);
    let seconds = timeStamp - minutes;
    seconds = Math.round(Time.toSeconds(seconds));
    const paddedSeconds = seconds.toString().padStart(2, '0');
    return  minutes + ':' + paddedSeconds;
  }

  public iconClasses(point: WayPoint): any {
    const classes = {
      'mr-3': true,
      'swim-down': point.swimDirection === SwimDirection.descent,
      'swim-up': point.swimDirection === SwimDirection.ascent,
      'swim-hover': point.swimDirection === SwimDirection.hover,
    };

    return classes;
  }
}
