import { Component, OnInit } from '@angular/core';

class Gas {
  constructor(public size: number, public startPressure: number) {
  }
}

@Component({
  selector: 'app-gases',
  templateUrl: './gases.component.html',
  styleUrls: ['./gases.component.css']
})
export class GasesComponent implements OnInit {
  private gases: Gas[] = [this.createGas()];

  constructor() { }

  ngOnInit() {
  }

  add(): void {
    const newGas = this.createGas();
    this.gases.push(newGas);
  }

  private createGas(): Gas {
    return new Gas(15, 200);
  }
}
