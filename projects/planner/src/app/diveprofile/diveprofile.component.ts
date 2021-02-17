import { Component, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive, WayPoint } from '../shared/models';
import { faTasks } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js/dist/plotly.js';
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
  private readonly elementName = 'diveplot';

  @Output()
  public chartHover: EventEmitter<string> = new EventEmitter<string>();

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

  public plotlyHover(data: any)  {
    // first data is the dive profile chart, x value is the timestamp as string
    const timeStampValue: string = data.points[0].x;
    this.chartHover.emit(timeStampValue);
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

    Plotly.react(this.elementName, data, layout, options);

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

    Plotly.plot(this.elementName, dataCeilings, layout, options);

    this.plotEvents();
  }

  private plotEvents(): void {
    const x = [];
    const y = [];
    const label = [];

    const dataEvents = [{
      x: x,
      y: y,
      label: label,
      text: label,
      type: 'scatter',
      mode: 'markers+text',
      fill: 'tozeroy',
      name: 'events',
      hovertemplate: '%{x}<br>%{text} at %{y}m',
      texttemplate: '%{x}<br>%{text} at %{y}m',
      textposition: 'top left',
      fillcolor: 'rgba(0, 0, 0, 0)',
      marker: {
        color: 'rgba(31, 119, 180, 0.5)',
        size: 8,
        // symbol: 'bowtie-open', // https://plotly.com/javascript/reference/#box-marker-symbol
        line: {
          color: 'rgba(31, 119, 180, 0.7)',
          width: 2
        }
      },
      showlegend: false
    }];

    const eventsLayout = {
      xaxis: {
        showgrid: false,
        showline: false
      },
      fig_bgcolor: 'rgb(255, 255, 255)',
      plot_bgcolor: 'rgba(0, 0, 0, 0)',
      paper_bgcolor: 'rgba(0, 0, 0, 0)'
    };

    this.dive.events.forEach((event, index, events) => {
        x.push(Time.toDate(event.timeStamp));
        y.push(event.depth);
        label.push(event.message);
    });

    Plotly.plot(this.elementName, dataEvents, eventsLayout);
  }

  private roundDepth(depth: number): number {
    return Math.round(depth * 100) / 100;
  }

  private resampleToSeconds(xValues: Date[], yValues: number[], item: WayPoint) {
    // possible performance optimization = remove all waypoints, where ceiling = 0 and depth didnt change
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
    const chartElement: any = document.getElementById(this.elementName);
    chartElement.on('plotly_hover', (e) => this.plotlyHover(e));
    chartElement.on('plotly_click', (e) => this.plotlyHover(e));
  }
}
