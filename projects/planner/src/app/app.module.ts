import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CustomFormsModule } from './validators/custom-forms.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ClipboardModule } from 'ngx-clipboard';

import { AppComponent } from './app.component';
import { TanksComponent } from './tanks/tanks.component';
import { DiverComponent } from './diver/diver.component';
import { DiveOptionsComponent } from './diveoptions/diveoptions.component';
import { DiveInfoComponent } from './diveinfo/diveinfo.component';
import { MainMenuComponent } from './mainmenu/mainmenu.component';
import { AppRoutingModule } from './app-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { GaslabelComponent } from './gaslabel/gaslabel.component';
import { SacComponent } from './sac/sac.component';
import { NitroxComponent } from './nitrox/nitrox.component';
import { WayPointsComponent } from './waypoints/waypoints.component';
import { ProfileChartComponent } from './profilechart/profilechart.component';
import { AboutComponent } from './about/about.component';
import { AppFooterComponent } from './footer/footer.component';
import { DepthsComponent } from './depths/depths.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { TankChartComponent } from './tank-chart/tank-chart.component';
import { AppSettingsComponent } from './app-settings/app-settings.component';

import { PlannerService } from './shared/planner.service';
import { PreferencesService } from './shared/preferences.service';
import { UnitConversion } from './shared/UnitConversion';
import { SelectedWaypoint } from './shared/selectedwaypointService';
import { CalculatingComponent } from './calculating/calculating.component';
import { DurationPipe } from './pipes/duration.pipe';
import { DatePipe } from '@angular/common';
import { WorkersFactory } from './shared/workers.factory';
import { WorkersFactoryCommon } from './shared/serial.workers.factory';
import { NdlLimitsComponent } from './ndl-limits/ndl-limits.component';
import { SalinityComponent } from './salinity/salinity.component';
import { AltitudeComponent } from './altitude/altitude.component';
import { GradientsComponent } from './gradients/gradients.component';

@NgModule({
    declarations: [
        AppComponent,
        TanksComponent,
        DiverComponent,
        DiveOptionsComponent,
        DiveInfoComponent,
        SacComponent,
        MainMenuComponent,
        DashboardComponent,
        GaslabelComponent,
        NitroxComponent,
        WayPointsComponent,
        ProfileChartComponent,
        AboutComponent,
        AppFooterComponent,
        DepthsComponent,
        TankChartComponent,
        AppSettingsComponent,
        CalculatingComponent,
        DurationPipe,
        NdlLimitsComponent,
        SalinityComponent,
        AltitudeComponent,
        GradientsComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        NgbModule,
        AppRoutingModule,
        CustomFormsModule,
        FontAwesomeModule,
        ClipboardModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: environment.production,
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        })
    ],
    exports: [],
    providers: [
        { provide: WorkersFactoryCommon, useClass: WorkersFactory },
        PlannerService,
        PreferencesService,
        UnitConversion,
        SelectedWaypoint,
        DatePipe,
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
