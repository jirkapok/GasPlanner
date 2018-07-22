import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiverComponent } from './diver/diver.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SacComponent } from './sac/sac.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'diver', component: DiverComponent },
  { path: 'sac', component: SacComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [ RouterModule ],
  declarations: []
})
export class AppRoutingModule { }
