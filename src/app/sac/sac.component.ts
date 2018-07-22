import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

import { SacCalculatorService } from '../shared/sac-calculator.service';
import { PlannerService } from '../shared/planner.service';

@Component({
  selector: 'app-sac',
  templateUrl: './sac.component.html',
  styleUrls: ['./sac.component.css']
})
export class SacComponent implements OnInit {
  public calcIcon = faCalculator;

  constructor(
    private router: Router,
    private planer: PlannerService, public calc: SacCalculatorService) {
  }

  public goBack(): void {
    this.router.navigateByUrl('/');
  }

  public use(): void {
    this.planer.diver.sac = this.calc.sac;
    this.router.navigateByUrl('/');
  }

  ngOnInit() {
  }
}
