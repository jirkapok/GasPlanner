import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiverComponent } from './diver/diver.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SacComponent } from './sac/sac.component';
import { NitroxComponent } from './nitrox/nitrox.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'diver', component: DiverComponent },
  { path: 'sac', component: SacComponent },
  { path: 'nitrox', component: NitroxComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [ RouterModule ],
  declarations: []
})
export class AppRoutingModule { }
