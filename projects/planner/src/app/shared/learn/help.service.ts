import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Urls } from '../navigation.service';

@Injectable({
    providedIn: 'root'
})
export class HelpService {
    private readonly documentSubject = new BehaviorSubject<string>(this.urls.helpMarkdownUrl(Urls.notAvailable));
    private readonly isOpenSubject = new BehaviorSubject<boolean>(false);

    public readonly document$ = this.documentSubject.asObservable();
    public readonly isOpen$ = this.isOpenSubject.asObservable();

    constructor(public urls: Urls) {
    }

    public openQuizHelp(): void {
        this.openHelp('quiz-help');
    }

    public openLearnWelcome(): void {
        this.openHelp('learn-welcome');
    }

    public openHelp(helpDocument: string): void {
        const path = this.urls.helpMarkdownUrl(helpDocument);

        this.documentSubject.next(path);
        this.isOpenSubject.next(true);
    }

    public closeHelp(): void {
        this.isOpenSubject.next(false);
    }
}
