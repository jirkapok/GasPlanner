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
  }

  ngOnInit() {
  }

  public get inMod(): boolean {
    return this.calc.calculation === NitroxMode.Mod;
  }

  public get inBestMix(): boolean {
    return this.calc.calculation === NitroxMode.BestMix;
  }

  public get inPO2(): boolean {
    return this.calc.calculation === NitroxMode.PO2;
  }

  public toMod(): void {
    this.calc.calculation = NitroxMode.Mod;
  }

  public toBestMix(): void {
    this.calc.calculation = NitroxMode.BestMix;
  }

  public toPO2(): void {
    this.calc.calculation = NitroxMode.PO2;
  }
}
