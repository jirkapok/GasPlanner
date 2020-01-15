import { Injectable } from '@angular/core';
import { DepthConverterService } from './depth-converter.service';

@Injectable({
  providedIn: 'root'
})
export class SacCalculatorService {
  depth = 15;
  tank = 15;
  used = 150;
  duration = 45;

  get sac(): number {
    const bars = DepthConverterService.toBar(this.depth);
    const result = this.tank * this.used / this.duration / bars;
    return Math.ceil(result * 100) / 100;
  }
}
