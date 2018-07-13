import { Component, OnInit } from '@angular/core';

class Plan {
  public time = true;

  constructor(public duration: number, public depth: number) {
  }
}

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css']
})
export class PlanComponent implements OnInit {
  public plan: Plan = new Plan(10, 30);

  constructor() { }

  ngOnInit() {
  }
}
