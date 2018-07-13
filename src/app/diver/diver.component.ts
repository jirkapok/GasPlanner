import { Component, OnInit } from '@angular/core';

class Diver {
  constructor(public sac: number) {
  }
}

@Component({
  selector: 'app-diver',
  templateUrl: './diver.component.html',
  styleUrls: ['./diver.component.css']
})
export class DiverComponent implements OnInit {
  public diver: Diver = new Diver(20);
  constructor() { }

  ngOnInit() {
  }
}
