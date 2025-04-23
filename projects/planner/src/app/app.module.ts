import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {ServiceWorkerModule} from '@angular/service-worker';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {DatePipe, DecimalPipe} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';

import {ClipboardModule} from 'ngx-clipboard';
import {MdbCollapseModule} from 'mdb-angular-ui-kit/collapse';
import {MdbDropdownModule} from 'mdb-angular-ui-kit/dropdown';
import {MdbFormsModule} from 'mdb-angular-ui-kit/forms';
import {MdbTabsModule} from 'mdb-angular-ui-kit/tabs';
import {MdbAccordionModule} from 'mdb-angular-ui-kit/accordion';

import {environment} from '../environments/environment';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {NgxMdModule} from 'ngx-md';

import {SacComponent} from './calculators/sac/sac.component';
import {NitroxComponent} from './calculators/nitrox/nitrox.component';
import {NdlLimitsComponent} from './calculators/ndl-limits/ndl-limits.component';
import {AltitudeCalcComponent} from './calculators/altitude-calc/altitude-calc.component';
import {WeightCalcComponent} from './calculators/weight/weight.component';
import {GasPropertiesCalcComponent} from './calculators/gas.props/gas.props.component';
import {RedundanciesComponent} from './calculators/redundancies/redundancies.component';
import { GasBlenderComponent } from './calculators/gas-blender/gas-blender.component';

import {CalculatingComponent} from './controls/calculating/calculating.component';
import {AltitudeComponent} from './controls/altitude/altitude.component';
import {GaslabelComponent} from './controls/gaslabel/gaslabel.component';
import {SalinityComponent} from './controls/salinity/salinity.component';
import {OxygenDropDownComponent} from './controls/oxygen-dropdown/oxygen-dropdown.component';
import {OxygenComponent} from './controls/oxygen/oxygen.component';
import {TankSizeComponent} from './controls/tank.size/tank.size.component';
import {GradientsComponent} from './controls/gradients/gradients.component';
import {PpO2Component} from './controls/pp-o2/pp-o2.component';
import {HelpModalComponent} from './help-modal/help-modal.component';
import {HelpComponent} from './help/help.component';

import {SurfaceIntervalComponent} from './plan/surface-interval/surface-interval.component';
import {PlanTabsComponent} from './plan/plan.tabs/plan.tabs.component';
import {TanksSimpleComponent} from './plan/tanks-simple/tanks-simple.component';
import {TanksComplexComponent} from './plan/tanks-complex/tanks-complex.component';
import {DiverComponent} from './plan/diver/diver.component';
import {DiveOptionsComponent} from './plan/diveoptions/diveoptions.component';
import {DiveInfoComponent} from './plan/diveinfo/diveinfo.component';
import {DashboardComponent} from './plan/dashboard/dashboard.component';
import {WayPointsComponent} from './plan/waypoints/waypoints.component';
import {ProfileChartComponent} from './plan/profilechart/profilechart.component';
import {DepthsSimpleComponent} from './plan/depths-simple/depths-simple.component';
import {DepthsComplexComponent} from './plan/depths-complex/depths-complex.component';
import {TankChartComponent} from './plan/tank-chart/tank-chart.component';
import {DepthComponent} from './plan/depth/depth.component';
import {DiveIssuesComponent} from './plan/dive-issues/dive-issues.component';

import {DiffComponent} from './diff/diff.component';
import {DiffTabsButtonComponent} from './diff/tabs/profile-button/diff-tabs-button.component';
import {DiffTabsComponent} from './diff/tabs/diff-tabs.component';
import {GasConsumedDifferenceComponent} from './diff/gasconsumed/diff-gas-consumed/diff-gas-consumed.component';
import {
    GasConsumedDifferenceTankComponent
} from './diff/gasconsumed/diff-gas-consumed/tank-chart/diff-gas-consumed-tank-chart.component';
import {WaypointsDifferenceComponent} from './diff/waypoints/diff-waypoints.component';
import {DiveResultsDifferenceComponent} from './diff/diveresults/diff-diveresults.component';
import {ProfileDifferenceChartComponent} from './diff/profilechart/diff-profilechart.component';
import {DiveResultsTableDifferenceComponent} from './diff/diveresults/table/diff-diveresults-table.component';

import {MainMenuComponent} from './mainmenu/mainmenu.component';
import {AboutComponent} from './about/about.component';
import {AppFooterComponent} from './footer/footer.component';
import {AppSettingsComponent} from './app-settings/app-settings.component';
import {DurationPipe} from './pipes/duration.pipe';
import {AppinfoComponent} from './appinfo/appinfo.component';
import {CardHeaderComponent} from './card-header/card-header.component';

import {PlannerService} from './shared/planner.service';
import {PreferencesStore} from './shared/preferencesStore';
import {UnitConversion} from './shared/UnitConversion';
import {SelectedWaypoint} from './shared/selectedwaypointService';
import {WorkersFactory} from './shared/workers.factory';
import {WorkersFactoryCommon} from './shared/serial.workers.factory';
import {NdlService} from './shared/ndl.service';
import {OptionsService} from './shared/options.service';
import {DelayedScheduleService} from './shared/delayedSchedule.service';
import {InputControls} from './shared/inputcontrols';
import {ValidatorGroups} from './shared/ValidatorGroups';
import {DepthsService} from './shared/depths.service';
import {TanksService} from './shared/tanks.service';
import {SacCalculatorService} from './shared/sac-calculator.service';
import {NitroxCalculatorService} from './shared/nitrox-calculator.service';
import {SettingsNormalizationService} from './shared/settings-normalization.service';
import {ViewSwitchService} from './shared/viewSwitchService';
import {Preferences} from './shared/preferences';
import {PlanUrlSerialization} from './shared/PlanUrlSerialization';
import {WayPointsService} from './shared/waypoints.service';
import {StopsFilter} from './shared/stopsFilter.service';
import {ViewStates} from './shared/viewStates';
import {Urls} from './shared/navigation.service';
import {SubViewStorage} from './shared/subViewStorage';
import {DashboardStartUp} from './shared/startUp';
import {DiveResults} from './shared/diveresults';
import {DiveSchedules} from './shared/dive.schedules';
import {RedundanciesService} from './shared/redundancies.service';
import {ReloadDispatcher} from './shared/reloadDispatcher';
import {ManagedDiveSchedules} from './shared/managedDiveSchedules';
import { GasBlenderService } from './shared/gas-blender.service';
import { ProfileComparatorService } from './shared/diff/profileComparatorService';
import { GasesComparisonService } from './shared/diff/gases-comparison.service';
import { ResultsComparison } from './shared/diff/results-comparison.service';
import { SelectedDiffWaypoint } from './shared/diff/selected-diff-waypoint.service';
import { ResamplingService } from './shared/ResamplingService';
import { ApplicationSettingsService } from './shared/ApplicationSettings';
import { IgnoredIssuesService } from './shared/IgnoredIssues.service';
import { BlendPricingService } from './shared/blend-pricing.service';
import { MdbModalModule } from 'mdb-angular-ui-kit/modal';
import { ShareDiveService } from './shared/ShareDiveService';

const ANGULAR_MODULES = [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FontAwesomeModule,
    ReactiveFormsModule
];

const MDB_MODULES = [
    MdbCollapseModule,
    MdbDropdownModule,
    MdbFormsModule,
    MdbTabsModule,
    MdbAccordionModule,
    MdbModalModule
];

const COMPONENTS = [
    AboutComponent,
    AppFooterComponent,
    AltitudeCalcComponent,
    AltitudeComponent,
    AppComponent,
    AppinfoComponent,
    AppSettingsComponent,
    CardHeaderComponent,
    CalculatingComponent,
    DashboardComponent,
    DepthComponent,
    DepthsComplexComponent,
    DepthsSimpleComponent,
    DiffComponent,
    DiveInfoComponent,
    DiveIssuesComponent,
    DiveOptionsComponent,
    DiverComponent,
    DurationPipe,
    GasBlenderComponent,
    GaslabelComponent,
    GasPropertiesCalcComponent,
    GradientsComponent,
    MainMenuComponent,
    NdlLimitsComponent,
    NitroxComponent,
    ProfileChartComponent,
    OxygenComponent,
    OxygenDropDownComponent,
    PpO2Component,
    PlanTabsComponent,
    RedundanciesComponent,
    SacComponent,
    SalinityComponent,
    TankChartComponent,
    TanksComplexComponent,
    TanksSimpleComponent,
    TankSizeComponent,
    WayPointsComponent,
    WeightCalcComponent,
    WaypointsDifferenceComponent,
    DiveResultsDifferenceComponent,
    ProfileDifferenceChartComponent,
    DiveResultsTableDifferenceComponent,
    DiffTabsComponent,
    DiffTabsButtonComponent,
    GasConsumedDifferenceComponent,
    GasConsumedDifferenceTankComponent
];

const STANDALONE = [
    SurfaceIntervalComponent,
    HelpModalComponent,
    HelpComponent
];

const SERVICES = [
    { provide: WorkersFactoryCommon, useClass: WorkersFactory },
    DatePipe,
    DecimalPipe,
    DashboardStartUp,
    DelayedScheduleService,
    DepthsService,
    DiveResults,
    DiveSchedules,
    GasBlenderService,
    InputControls,
    ManagedDiveSchedules,
    NdlService,
    NitroxCalculatorService,
    OptionsService,
    PlanUrlSerialization,
    PlannerService,
    Preferences,
    PreferencesStore,
    ReloadDispatcher,
    RedundanciesService,
    SacCalculatorService,
    SelectedWaypoint,
    SelectedDiffWaypoint,
    SettingsNormalizationService,
    StopsFilter,
    SubViewStorage,
    TanksService,
    UnitConversion,
    Urls,
    ValidatorGroups,
    ViewStates,
    ViewSwitchService,
    WayPointsService,
    ProfileComparatorService,
    GasesComparisonService,
    ResultsComparison,
    ResamplingService,
    ApplicationSettingsService,
    IgnoredIssuesService,
    BlendPricingService,
    ShareDiveService
];

@NgModule({
    declarations: COMPONENTS,
    imports: [
        ...ANGULAR_MODULES,
        ...MDB_MODULES,
        STANDALONE,
        HttpClientModule,
        NgxMdModule.forRoot(),
        ClipboardModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        })
    ],
    exports: [],
    providers: SERVICES,
    bootstrap: [AppComponent]
})
export class AppModule { }
