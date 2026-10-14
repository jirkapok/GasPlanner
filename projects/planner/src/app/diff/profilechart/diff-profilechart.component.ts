import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChartArea, faFire } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import * as Plotly from 'plotly.js-dist';
import { Streamed } from '../../shared/streamed';
import { ChartPlotterFactory, ChartPlotter } from '../../shared/chartPlotter';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { HeatMapPlotter } from '../../shared/heatMapPlotter';
import { CalculatingComponent } from '../../controls/calculating/calculating.component';

@Component({
    selector: 'app-diff-profilechart',
    templateUrl: './diff-profilechart.component.html',
    styleUrls: ['./diff-profilechart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, NgClass, CalculatingComponent, TranslatePipe]
})
export class ProfileDifferenceChartComponent extends Streamed implements OnInit {






    // TODO: Implement/Fix selectWayPoint
    // TODO: Heat maps
    // TODO: Tests

    // Remember to note: selectionChanged is not a bad name. The only issue *might* be that
    // it outputs for both profile and alignByEnd, which might lead to rerendering in components
    // unrelated to DiffChart (but this is a web app, so I guess it's whatever)
    // Also, remember translated text.







    public icon = faChartArea;
    protected readonly heatmapIcon = faFire;
    public showHeatMap = true;
    private plotter: ChartPlotter;
    private heatMapPlotterA: HeatMapPlotter;
    private heatMapPlotterB: HeatMapPlotter;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoints: SelectedDiffWaypoint,
        private profileComparatorService: ProfileComparatorService,
        private reloadDispatcher: ReloadDispatcher,
        private translate: TranslateService) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units, key => this.translate.instant(key));
        const profileATraces = chartPlotterFactory.withNamePrefix('diffResultsTable.profileA')
            .withTimeOffset(() => this.profileComparatorService.profileATimeOffset)
            .create(() => this.profileComparatorService.profileAResults);
        const profileBTraces = chartPlotterFactory
            .withNamePrefix('diffResultsTable.profileB')
            .wthAverageDepthColor('rgb(188,191,192)')
            .wthDepthColor(ChartPlotterFactory.depthLineColorB)
            .wthCeilingColor(ChartPlotterFactory.depthLineColorB)
            .wthEventFillColor(ChartPlotterFactory.depthLineColorB)
            .wthEventLineColor('rgb(118,119,120)')
            .withTimeOffset(() => this.profileComparatorService.profileBTimeOffset)
            .create(() => this.profileComparatorService.profileBResults);

        this.plotter = new ChartPlotter('diveplotdiff', () => this.profileComparatorService.totalDuration,
            chartPlotterFactory, profileBTraces, profileATraces);
        this.heatMapPlotterA = new HeatMapPlotter('heatmapPlotA');
        this.heatMapPlotterB = new HeatMapPlotter('heatmapPlotB');

        this.subscribeToObservables();
    }

    protected get profilesCalculated(): boolean {
        return this.profileComparatorService.profilesCalculated;
    }

    protected get alignByEnd(): boolean {
        return this.profileComparatorService.alignByEnd;
    }

    protected set alignByEnd(value: boolean) {
        this.profileComparatorService.alignByEnd = value;
    }

    public ngOnInit(): void {
        if (this.profilesCalculated) {
            this.plotCharts();
            this.hookChartEvents();
        }
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x?.toString() ?? '';
        this.selectedWaypoints.selectedTimeStamp = timeStampValue;
    }

    protected toggleHeatMap(): void {
        this.showHeatMap = !this.showHeatMap;
    }

    private plotlyHoverLeave() {
        this.selectedWaypoints.selectedTimeStamp = '';
        this.selectWayPoint(undefined);
    }

    private selectWayPoint(selected: ComparedWaypoint | undefined): void {
        if (!selected) {
            this.plotter.plotCursor(undefined);
            return;
        }

        const { wayPoint, offset } = selected.durationA
        ? {
            wayPoint: selected.wayPointA,
            offset: this.profileComparatorService.profileATimeOffset,
          }
        : {
            wayPoint: selected.wayPointB,
            offset: this.profileComparatorService.profileBTimeOffset,
          };

        if (wayPoint) {
            wayPoint.startTime += offset;
            wayPoint.endTime += offset;
        }

        this.plotter.plotCursor(wayPoint);
    }

    private plotCharts(): void {
        this.plotter.plotAllCharts();

        if(this.showHeatMap) {
            var overPressures = this.profileComparatorService.overPressures;
            this.heatMapPlotterA.plotHeatMap(overPressures.profileAOverPressures);
            this.heatMapPlotterB.plotHeatMap(overPressures.profileBOverPressures);
        }
    }

    private hookChartEvents(): void {
        // used any to prevent typescript type gymnastic
        const chartElement: any = document.getElementById(this.plotter.elementName);
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }

    private subscribeToObservables(): void {
        this.profileComparatorService.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.plotCharts();
                }
            });

        this.selectedWaypoints.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((selected: ComparedWaypoint) => {
                this.selectWayPoint(selected);
            });

        this.reloadDispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.plotCharts();
                    this.plotlyHoverLeave();
                }
            });

        this.translate.onLangChange.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.plotCharts();
                }
            });
    }
}
