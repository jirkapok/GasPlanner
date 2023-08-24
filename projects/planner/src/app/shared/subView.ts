import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

// TODO removed redundant layer
@Injectable()
export abstract class SubViewComponent {
    constructor(private location: Location) { }

    public goBack(): void {
        this.location.back();
    }
}
