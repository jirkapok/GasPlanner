import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DepthConverterService {
  public toAtm(depth: number): number {
    return depth / 10 + 1;
  }

  public fromAtm(atm: number): number {
    return (atm - 1) * 10;
  }
}
