import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SacCalculatorService {
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
