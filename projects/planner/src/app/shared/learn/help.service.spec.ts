import { TestBed } from '@angular/core/testing';
import { Overlay } from '@angular/cdk/overlay';

import { HelpService } from './help.service';
import { LayoutService } from '../layout.service';
import { Urls } from '../navigation.service';

describe('HelpService', () => {
    let service: HelpService;
    let urls: Urls;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                HelpService,
                Overlay,
                Urls,
                LayoutService
            ]
        });

        service = TestBed.inject(HelpService);
        urls = TestBed.inject(Urls);
    });

    it('sets the correct help document', () => {
        service.openHelp('quiz-help');

        const expectedDocument = urls.helpMarkdownUrl('quiz-help');

        expect(service.document).toBe(expectedDocument);
    });

    it('opens the help overlay', () => {

    });

    it('closes the help overlay', () => {

    });
});
