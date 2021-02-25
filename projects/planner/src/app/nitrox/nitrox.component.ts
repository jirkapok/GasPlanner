import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { NitroxCalculatorService, NitroxMode } from '../shared/nitrox-calculator.service';
import { PlannerService } from '../shared/planner.service';

@Component({
  selector: 'app-nitrox',
  templateUrl: './nitrox.component.html',
  styleUrls: ['./nitrox.component.css']
})
export class NitroxComponent implements OnInit {
  public calcIcon = faCalculator;
  constructor(public calc: NitroxCalculatorService,
    private router: Router, private planer: PlannerService) {
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

  public goBack(): void {
    this.router.navigateByUrl('/');
  }

  public use(): void {
    this.planer.firstTank.o2 = this.calc.fO2;
    this.planer.diver.maxPpO2 = this.calc.pO2;
    this.router.navigateByUrl('/');
  }
}
