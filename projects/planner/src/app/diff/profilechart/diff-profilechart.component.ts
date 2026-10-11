import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { takeUntil } from 'rxjs';
import { faChartArea, faFire } from '@fortawesome/free-solid-svg-icons';
import * as Plotly from 'plotly.js-dist';
import { Streamed } from '../../shared/streamed';
import { ChartPlotterFactory, ChartPlotter } from '../../shared/chartPlotter';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';
import { WayPoint } from '../../shared/wayPoint';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { HeatMapPlotter } from '../../shared/heatMapPlotter';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgClass } from '@angular/common';
import { CalculatingComponent } from '../../controls/calculating/calculating.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { DiffOptions } from '../../shared/diff/diff-options.service';

@Component({
    selector: 'app-diff-profilechart',
    templateUrl: './diff-profilechart.component.html',
    styleUrls: ['./diff-profilechart.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [FaIconComponent, NgClass, CalculatingComponent, TranslatePipe]
})
export class ProfileDifferenceChartComponent extends Streamed implements OnInit {






    // TODO: Switch from ms to s in service
    // TODO: Add translated checkbox text
    // TODO: Heat maps
    // REMEMBER: Ask whether the end alignment should be part of the url or storage or something







    public icon = faChartArea;
    protected readonly heatmapIcon = faFire;
    public showHeatMap = true;
    private plotter: ChartPlotter;
    private heatMapPlotterA: HeatMapPlotter;
    private heatMapPlotterB: HeatMapPlotter;
    // Offsets on the x axis (in seconds)
    private timeOffsetA = 0;
    private timeOffsetB = 0;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoints: SelectedDiffWaypoint,
        private profileComparatorService: ProfileComparatorService,
        private options: DiffOptions,
        private reloadDispatcher: ReloadDispatcher,
        private translate: TranslateService) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units, key => this.translate.instant(key));
        const profileATraces = chartPlotterFactory.withNamePrefix('diffResultsTable.profileA')
            .withTimeOffset(this.timeOffsetA)
            .create(() => this.profileComparatorService.profileAResults);
        const profileBTraces = chartPlotterFactory
            .withNamePrefix('diffResultsTable.profileB')
            .wthAverageDepthColor('rgb(188,191,192)')
            .wthDepthColor(ChartPlotterFactory.depthLineColorB)
            .wthCeilingColor(ChartPlotterFactory.depthLineColorB)
            .wthEventFillColor(ChartPlotterFactory.depthLineColorB)
            .wthEventLineColor('rgb(118,119,120)')
            .withTimeOffset(this.timeOffsetB)
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
        return this.options.alignChartByEnd;
    }

    protected set alignByEnd(value: boolean) {
        this.options.alignChartByEnd = value;
    }

    public ngOnInit(): void {
        if (this.profilesCalculated) {
            this.updateOffsets();
            this.plotCharts();
            this.hookChartEvents();
        }
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x?.toString() ?? '';
        this.selectedWaypoints.selectedTimeStamp = timeStampValue;
    }

    public switchHeatMap(): void {
        this.showHeatMap = !this.showHeatMap;
    }

    private updateOffsets(): void {
        if (!this.alignByEnd) {
            this.timeOffsetA = 0;
            this.timeOffsetB = 0;
            return;
        }

        const totalDuration = this.profileComparatorService.totalDuration;
        const durationA = this.profileComparatorService.profileAResults.totalDuration;
        const durationB = this.profileComparatorService.profileBResults.totalDuration;

        this.timeOffsetA = totalDuration - durationA;
        this.timeOffsetB = totalDuration - durationB;
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
            offset: this.timeOffsetA,
          }
        : {
            wayPoint: selected.wayPointB,
            offset: this.timeOffsetB,
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
                    this.updateOffsets();
                    this.plotCharts();
                }
            });

        this.options.optionsChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.updateOffsets();
                    this.plotCharts();
                }
            })

        this.selectedWaypoints.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((selected: ComparedWaypoint) => {
                this.selectWayPoint(selected);
            });

        this.reloadDispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.updateOffsets();
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
