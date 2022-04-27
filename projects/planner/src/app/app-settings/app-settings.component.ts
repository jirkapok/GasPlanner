import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-app-settings',
    templateUrl: './app-settings.component.html',
    styleUrls: ['./app-settings.component.css']
})
export class AppSettingsComponent {
    constructor(private router: Router) { }

    public async goBack(): Promise<boolean> {
        return await this.router.navigateByUrl('/');
    }
}
