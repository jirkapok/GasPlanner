import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { GasesComponent } from './gases/gases.component';
import { DiverComponent } from './diver/diver.component';
import { PlanComponent } from './plan/plan.component';
import { DiveComponent } from './dive/dive.component';
import { PlannerService } from './planner.service';
import { PreferencesService } from './preferences.service';

@NgModule({
  declarations: [
    AppComponent,
    GasesComponent,
    DiverComponent,
    PlanComponent,
    DiveComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgbModule.forRoot()
  ],
  exports: [],
  providers: [ PlannerService, PreferencesService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
