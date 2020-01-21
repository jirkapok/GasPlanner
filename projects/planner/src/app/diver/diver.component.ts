import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { faUser } from '@fortawesome/free-solid-svg-icons';

import { PlannerService } from '../shared/planner.service';
import { Diver } from '../shared/models';

@Component({
  selector: 'app-diver',
  templateUrl: './diver.component.html',
  styleUrls: ['./diver.component.css']
})
export class DiverComponent implements OnInit {
  public diver: Diver;
  public user = faUser;
  constructor(private planer: PlannerService, private router: Router) { }

  public goBack(): void {
    this.router.navigateByUrl('/');
  }

  ngOnInit() {
    this.diver = this.planer.diver;
  }
}
