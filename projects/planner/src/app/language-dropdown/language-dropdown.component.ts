import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { LanguageService } from '../shared/language.service';

@Component({
    selector: 'app-language-dropdown',
    templateUrl: './language-dropdown.component.html',
    styleUrls: ['./language-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MdbDropdownModule]
})
export class LanguageDropdownComponent {
    /** Renders the toggle as a navbar-style nav-link instead of a button, for placement in the main menu. */
    @Input() public navbar = false;

    constructor(public language: LanguageService) {}

    public get current(): { code: string; nativeName: string; flag: string } | undefined {
        return this.language.languages.find(l => l.code === this.language.currentLanguage);
    }

    public select(code: string): void {
        this.language.setLanguage(code);
    }
}
