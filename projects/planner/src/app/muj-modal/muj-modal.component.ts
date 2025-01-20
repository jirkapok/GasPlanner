import { Component } from '@angular/core';
import { MdbModalRef } from "mdb-angular-ui-kit/modal";

@Component({
  selector: 'app-muj-modal',
  standalone: true,
  imports: [],
  templateUrl: './muj-modal.component.html',
  styleUrl: './muj-modal.component.scss'
})
export class MujModalComponent {
    constructor(public modalRef: MdbModalRef<MujModalComponent>) {}
}
