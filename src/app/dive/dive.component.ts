import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Dive } from '../shared/models';

@Component({
  selector: 'app-dive',
  templateUrl: './dive.component.html',
  styleUrls: ['./dive.component.css']
})
export class DiveComponent implements OnInit {
  public dive: Dive;

  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.dive = this.planer.dive;
  }
}
