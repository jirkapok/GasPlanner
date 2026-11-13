import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faChartArea, faFire } from '@fortawesome/free-solid-svg-icons';
import { takeUntil } from 'rxjs';
import * as Plotly from 'plotly.js-dist';
import { Streamed } from '../../shared/streamed';
import { ChartPlotterFactory, ChartPlotter, DiveTracesBuilder, HoverColors } from '../../shared/chartPlotter';
import { ProfileHoverValues } from '../../shared/profileHoverValues';
import { ProfileComparatorService } from '../../shared/diff/profileComparatorService';
import { SelectedDiffWaypoint } from '../../shared/diff/selected-diff-waypoint.service';
import { ComparedWaypoint } from '../../shared/diff/ComparedWaypoint';
import { UnitConversion } from '../../shared/UnitConversion';
import { ResamplingService } from '../../shared/ResamplingService';
import { ReloadDispatcher } from '../../shared/reloadDispatcher';
import { HeatMapPlotter } from '../../shared/heatMapPlotter';
import { CalculatingComponent } from '../../controls/calculating/calculating.component';
import { HoverValuesComponent } from '../../controls/hover-values/hover-values.component';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
    selector: 'app-diff-profilechart',
    templateUrl: './diff-profilechart.component.html',
    styleUrls: ['./diff-profilechart.component.scss'],
    imports: [FaIconComponent, NgClass, CalculatingComponent, TranslatePipe, HoverValuesComponent, DurationPipe]
})
export class ProfileDifferenceChartComponent extends Streamed implements OnInit {
    public icon = faChartArea;
    public showHeatMap = true;
    public hoverValuesA: ProfileHoverValues | undefined;
    public hoverValuesB: ProfileHoverValues | undefined;
    public readonly hoverColorsA: HoverColors;
    public readonly hoverColorsB: HoverColors;
    protected readonly heatmapIcon = faFire;
    private plotter: ChartPlotter;
    private heatMapPlotterA: HeatMapPlotter;
    private heatMapPlotterB: HeatMapPlotter;
    private profileATraces: DiveTracesBuilder;
    private profileBTraces: DiveTracesBuilder;

    constructor(
        units: UnitConversion,
        resampling: ResamplingService,
        private selectedWaypoints: SelectedDiffWaypoint,
        private profileComparatorService: ProfileComparatorService,
        private reloadDispatcher: ReloadDispatcher,
        private translate: TranslateService,
        private cd: ChangeDetectorRef) {
        super();

        const chartPlotterFactory = new ChartPlotterFactory(resampling, units, key => this.translate.instant(key) as string);
        this.profileATraces = chartPlotterFactory.withNamePrefix('diffResultsTable.profileA')
            .withoutHoverLabels()
            .withTimeOffset(() => this.profileComparatorService.profileATimeOffset)
            .create(() => this.profileComparatorService.profileAResults);
        this.profileBTraces = chartPlotterFactory
            .withNamePrefix('diffResultsTable.profileB')
            .wthAverageDepthColor(ChartPlotterFactory.averageDepthColorB)
            .wthDepthColor(ChartPlotterFactory.depthLineColorB)
            .wthCeilingColor(ChartPlotterFactory.ceilingLineColorB)
            .wthEventFillColor(ChartPlotterFactory.depthLineColorB)
            .wthEventLineColor(ChartPlotterFactory.eventFillColorB)
            .withTimeOffset(() => this.profileComparatorService.profileBTimeOffset)
            .create(() => this.profileComparatorService.profileBResults);

        this.plotter = new ChartPlotter('diveplotdiff', () => this.profileComparatorService.totalDuration,
            chartPlotterFactory, this.profileBTraces, this.profileATraces);
        this.hoverColorsA = this.profileATraces.hoverColors;
        this.hoverColorsB = this.profileBTraces.hoverColors;
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
        this.plotCharts();
        this.hookChartEvents();
    }

    public plotlyHover(data: Plotly.PlotMouseEvent): void {
        // first data is the dive profile chart, x value is the timestamp as string
        const timeStampValue: string = data.points[0].x?.toString() ?? '';
        this.selectedWaypoints.selectedTimeStamp = timeStampValue;
        this.hoverValuesA = ProfileHoverValues.fromPoints(data.points, this.profileATraces.uidPrefix);
        this.hoverValuesB = ProfileHoverValues.fromPoints(data.points, this.profileBTraces.uidPrefix);
        // Plotly events are outside Angular events, so they have to schedule the change detection
        this.cd.markForCheck();
    }

    public plotlyHoverLeave(): void {
        this.selectedWaypoints.selectedTimeStamp = '';
        this.selectWayPoint(undefined);
        this.clearHoverValues();
    }

    protected toggleHeatMap(): void {
        this.showHeatMap = !this.showHeatMap;

        if (this.profilesCalculated) {
            this.redrawCharts();
        }
    }

    protected toggleAlignByEnd(): void {
        this.alignByEnd = !this.alignByEnd;
    }

    private clearHoverValues(): void {
        this.hoverValuesA = undefined;
        this.hoverValuesB = undefined;
        this.cd.markForCheck();
    }

    private selectWayPoint(selected: ComparedWaypoint | undefined): void {
        this.plotter.plotCursors(selected?.wayPointA, selected?.wayPointB);
    }

    /** Applies pending template changes first, because Plotly can't size hidden plot elements */
    private redrawCharts(): void {
        this.cd.detectChanges();
        this.plotCharts();
    }

    private plotCharts(): void {
        this.plotter.plotAllCharts();

        if(this.showHeatMap) {
            const overPressures = this.profileComparatorService.overPressures;
            void this.heatMapPlotterA.plotHeatMap(overPressures.profileAOverPressures);
            void this.heatMapPlotterB.plotHeatMap(overPressures.profileBOverPressures);
        }
    }

    private hookChartEvents(): void {
        const chartElement = document.getElementById(this.plotter.elementName) as Plotly.PlotlyHTMLElement;
        chartElement.on('plotly_hover', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_click', (e: Plotly.PlotMouseEvent) => this.plotlyHover(e));
        chartElement.on('plotly_unhover', () => this.plotlyHoverLeave());
    }

    private subscribeToObservables(): void {
        // touch devices don't always send unhover, so hovered values would be stale
        this.profileComparatorService.selectionChanged$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.redrawCharts();
                    this.plotlyHoverLeave();
                } else {
                    // chart isn't drawn yet, so there is no cursor to remove
                    this.clearHoverValues();
                }
            });

        this.selectedWaypoints.selectedChanged.pipe(takeUntil(this.unsubscribe$))
            .subscribe((selected) => {
                this.selectWayPoint(selected);
            });

        this.reloadDispatcher.infoCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.redrawCharts();
                    this.plotlyHoverLeave();
                }
            });

        this.reloadDispatcher.wayPointsCalculated$.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.redrawCharts();
                    this.plotlyHoverLeave();
                }
            });

        this.translate.onLangChange.pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                if (this.profilesCalculated) {
                    this.redrawCharts();
                }
            });
    }
}
