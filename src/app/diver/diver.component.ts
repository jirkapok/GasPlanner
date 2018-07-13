import { Component, OnInit } from '@angular/core';
import { PlannerService } from '../shared/planner.service';
import { Diver } from '../shared/models';

@Component({
  selector: 'app-diver',
  templateUrl: './diver.component.html',
  styleUrls: ['./diver.component.css']
})
export class DiverComponent implements OnInit {
  public diver: Diver;
  constructor(private planer: PlannerService) { }

  ngOnInit() {
    this.diver = this.planer.diver;
  }
}
