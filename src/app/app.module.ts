import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms'; 

import { AppComponent } from './app.component';
import { GasesComponent } from './gases/gases.component';
import { DiverComponent } from './diver/diver.component';
import { PlanComponent } from './plan/plan.component';
import { DiveComponent } from './dive/dive.component';
import { PlannerService } from './planner.service';


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
    FormsModule
  ],
  providers: [ PlannerService ],
  bootstrap: [AppComponent]
})
export class AppModule { }
