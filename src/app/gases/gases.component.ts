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

  remove(selected: Gas): void {
    if (this.gases.length <= 1) {
      return;
    }

    this.gases.forEach( (item, index) => {
      if (item === selected) {
        this.gases.splice(index, 1);
      }
    });
  }

  private createGas(): Gas {
    return new Gas(15, 200);
  }
}
