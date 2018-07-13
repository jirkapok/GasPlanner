import { Component, OnInit } from '@angular/core';

class Dive {
  constructor(public duration: number, public depth: number) {
  }
}

@Component({
  selector: 'app-dive',
  templateUrl: './dive.component.html',
  styleUrls: ['./dive.component.css']
})
export class DiveComponent implements OnInit {
  public dive: Dive = new Dive(10, 30);

  constructor() { }

  ngOnInit() {
  }
}
