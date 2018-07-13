import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Gas } from '../shared/models';

@Component({
  selector: 'app-gaslabel',
  templateUrl: './gaslabel.component.html',
  styleUrls: ['./gaslabel.component.css']
})
export class GaslabelComponent implements OnInit {
  bottomGas: Gas;

  public get gasMod(): number {
    return this.bottomGas.mod(this.planer.diver.maxPpO2);
  }

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.bottomGas = this.planer.gas;
  }

}
