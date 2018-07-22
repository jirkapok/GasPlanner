import { Component, OnInit } from '@angular/core';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { NitroxCalculatorService, NitroxMode } from '../shared/nitrox-calculator.service';

@Component({
  selector: 'app-nitrox',
  templateUrl: './nitrox.component.html',
  styleUrls: ['./nitrox.component.css']
})
export class NitroxComponent implements OnInit {
  public calcIcon = faCalculator;
  constructor(public calc: NitroxCalculatorService) {
    this.calc.calculation = NitroxMode.PO2;
   }

  ngOnInit() {
  }
}
