import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MdbDropdownModule } from 'mdb-angular-ui-kit/dropdown';
import { LanguageOption, LanguageService } from '../shared/language.service';
import { PreferencesStore } from '../shared/preferencesStore';

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

    constructor(public languages: LanguageService, private preferences: PreferencesStore) {}

    public select(code: string): void {
        this.languages.setLanguage(code);
        this.preferences.save();
    }

    public iconFor(language: LanguageOption | undefined): string {
        return `fi-${ language?.countryCode }`;
    }
}
