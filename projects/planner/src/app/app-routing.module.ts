import {
    ActivatedRouteSnapshot,
    CanActivateFn,
    provideRouter,
    Router,
    RouterModule,
    Routes,
    UrlTree,
    withComponentInputBinding
} from '@angular/router';
import { Location } from '@angular/common';
import { AppSettingsComponent } from './app-settings/app-settings.component';
import { DashboardComponent } from './plan/dashboard/dashboard.component';
import { NgModule, inject } from '@angular/core';
import { KnownViews, ViewStates } from './shared/viewStates';
import { AboutComponent } from './about/about.component';
import { DiffComponent } from './diff/diff.component';
import { SacComponent } from './calculators/sac/sac.component';
import { NitroxComponent } from './calculators/nitrox/nitrox.component';
import { NdlLimitsComponent } from './calculators/ndl-limits/ndl-limits.component';
import { AltitudeCalcComponent } from './calculators/altitude-calc/altitude-calc.component';
import { WeightCalcComponent } from './calculators/weight/weight.component';
import { GasPropertiesCalcComponent } from './calculators/gas.props/gas.props.component';
import { RedundanciesComponent } from './calculators/redundancies/redundancies.component';
import { GasBlenderComponent } from './calculators/gas-blender/gas-blender.component';
import { HelpOverviewComponent } from './helpOverview/help-overview.component';

const canActivateDashboard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
    const router = inject(Router);
    const viewStates = inject(ViewStates);
    // the only view with params is dashboard
    const isEmptyAddress = route.queryParamMap.keys.length === 0;

    if (isEmptyAddress && viewStates.redirectToView) {
        const target = `/${viewStates.lastView}`;
        const location = inject(Location);
        location.go(target);
        const result = router.parseUrl(target);
        return result;
    }

    return true;
};

const routes: Routes = [
    { path: KnownViews.settings, component: AppSettingsComponent },
    { path: KnownViews.sac, component: SacComponent },
    { path: KnownViews.nitrox, component: NitroxComponent },
    { path: KnownViews.ndl, component: NdlLimitsComponent },
    { path: KnownViews.altitude, component: AltitudeCalcComponent },
    { path: KnownViews.weight, component: WeightCalcComponent },
    { path: KnownViews.gas, component: GasPropertiesCalcComponent },
    { path: KnownViews.about, component: AboutComponent },
    { path: KnownViews.diff, component: DiffComponent },
    { path: KnownViews.redundancies, component: RedundanciesComponent },
    { path: KnownViews.blender, component: GasBlenderComponent },
    { path: `${KnownViews.helpOverview}/:label`, component: HelpOverviewComponent},
    { path: KnownViews.helpOverview, redirectTo: `${KnownViews.helpOverview}/readme`, pathMatch: 'full' },
    {
        path: '**',
        component: DashboardComponent,
        canActivate: [canActivateDashboard]
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes)
    ],
    exports: [RouterModule],
    providers: [
        provideRouter(routes, withComponentInputBinding()),
    ],
    declarations: []
})
export class AppRoutingModule { }
