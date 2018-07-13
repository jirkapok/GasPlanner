import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Gases, Gas, Diver } from '../shared/models';

@Component({
  selector: 'app-gases',
  templateUrl: './gases.component.html',
  styleUrls: ['./gases.component.css']
})
export class GasesComponent implements OnInit {
  private diver: Diver;
  public gas: Gas;
  public gasNames: string[];

  constructor(private planer: PlannerService) { }

  @Output() validate: EventEmitter<any> = new EventEmitter();

  ngOnInit() {
    this.gas = this.planer.gas;
    this.diver = this.planer.diver;
    this.gasNames = Gases.gasNames();
  }

  public gasSac(gas: Gas): number {
    return this.diver.gasSac(gas);
  }
}
