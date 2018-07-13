import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mainmenu',
  templateUrl: './mainmenu.component.html',
  styleUrls: ['./mainmenu.component.css']
})
export class MainMenuComponent implements OnInit {
  public isNavbarCollapsed = true;

  constructor() { }

  ngOnInit() {
  }
}
