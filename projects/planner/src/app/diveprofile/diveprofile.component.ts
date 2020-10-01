import { Component, OnInit, OnDestroy } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint } from '../shared/models';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js-dist';
import { Subscription } from 'rxjs';
import { Time } from 'scuba-physics';

@Component({
  selector: 'app-diveprofile',
  templateUrl: './diveprofile.component.html',
  styleUrls: ['./diveprofile.component.css']
})
export class DiveProfileComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  public dive: Dive;
  public tasks = faTasks;

  public scaleWidth(x: number, graphWidth: number): number {
    return x * graphWidth / this.dive.totalDuration;
  }

  public scaleHeight(y: number, graphHeight: number): number {
    return y * (graphHeight - 10) / this.dive.maxDepth;
  }

  public get noDecoTime(): number {
    return this.planer.plan.noDecoTime;
  }

  constructor(private planer: PlannerService) {
    this.subscription = this.planer.calculated.subscribe(() => {
        this.plotChart();
    });
   }

   ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private selectTimeFormat(): string {
    if (this.dive.hasHoursRuntime) {
       return '%H:%M:%S';
    }

    return '%M:%S';
  }

  private plotChart() {
    const layout = {
      autosize: true,
      showlegend: false,
      xaxis : {
        fixedrange: true,
        tickformat: this.selectTimeFormat(),
        title: {
          text: 'Time [minutes]'
        }
      },
      yaxis: {
        fixedrange: true,
        autorange: 'reversed',
        title: {
          text: 'Depth [meters]'
        }
      },
      margin: { l: 40, r: 10, b: 40, t: 10 },
    };

    const options = {
      displaylogo: false,
      displayModeBar: false,
      responsive: true,
      // staticPlot: true,
      autosize: true,
      scrollZoom: false,
      editable: false
    };

    const xValues = [];
    const yValues = [];

    const data = [{
      x: xValues,
      y: yValues,
      type: 'scatter',
      name: 'dive',
      marker: {
        color: 'rgb(31, 119, 180)'
      }
    }];

    this.dive.wayPoints.forEach((item, index, waypoints) => {
        this.resampleToSeconds(xValues, yValues, item);
      });

    Plotly.react('diveplot', data, layout, options);

    const xCeilingValues = [];
    const yCeilingValues = [];

    this.dive.ceilings.forEach((item, index, ceilings) => {
      xCeilingValues.push(Time.toDate(item.time));
      const depth = this.roundDepth(item.depth);
      yCeilingValues.push(depth);
    });

    const dataCeilings = [{
      x: xCeilingValues,
      y: yCeilingValues,
      type: 'scatter',
      fill: 'tozeroy',
      name: 'ceilings',
      marker: {
        color: 'rgb(255, 160, 73)'
      }
    }];

    Plotly.plot('diveplot', dataCeilings, layout, options);
  }

  private roundDepth(depth: number): number {
    return Math.round(depth * 100) / 100;
  }

  private resampleToSeconds(xValues: Date[], yValues: number[], item: WayPoint) {
    const speed = (item.endDepth - item.startDepth) / item.duration;
    for (let timeStamp = item.startTime; timeStamp < item.endTime; timeStamp++) {
      xValues.push(Time.toDate(timeStamp));
      let depth = item.startDepth + (timeStamp - item.startTime) * speed;
      depth = this.roundDepth(depth);
      yValues.push(depth);
    }

    // fix end of the dive
    xValues.push(Time.toDate(item.endTime));
    yValues.push(item.endDepth);
  }

  ngOnInit() {
    this.dive = this.planer.dive;
    this.plotChart();
  }
}
