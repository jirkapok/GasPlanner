import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppSettingsComponent } from './app-settings/app-settings.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SacComponent } from './sac/sac.component';
import { NitroxComponent } from './nitrox/nitrox.component';
import { AboutComponent } from './about/about.component';
import { NdlLimitsComponent } from './ndl-limits/ndl-limits.component';

const routes: Routes = [
    { path: 'settings', component: AppSettingsComponent },
    { path: 'sac', component: SacComponent },
    { path: 'nitrox', component: NitroxComponent },
    { path: 'ndl', component: NdlLimitsComponent },
    { path: 'about', component: AboutComponent },
    { path: '**', component: DashboardComponent },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes)
    ],
    exports: [RouterModule],
    declarations: []
})
export class AppRoutingModule { }
