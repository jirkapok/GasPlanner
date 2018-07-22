import { Component, OnInit } from '@angular/core';

class SacCalculatorService {
  depth = 15;
  tank = 15;
  used = 150;
  duration = 45;

  get sac(): number {
    const atm = 1 + this.depth / 10;
    const result = this.tank * this.used / this.duration / atm;
    return Math.ceil(result * 100) / 100;
  }
}

@Component({
  selector: 'app-sac',
  templateUrl: './sac.component.html',
  styleUrls: ['./sac.component.css']
})
export class SacComponent implements OnInit {
  private calc = new SacCalculatorService();

  constructor() {

   }

  ngOnInit() {
  }

}
