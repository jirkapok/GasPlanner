import { TestBed } from '@angular/core/testing';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of } from 'rxjs';
import { HelpService } from './help.service';
import { LayoutService } from '../layout.service';
import { Urls } from '../navigation.service';

describe('HelpService', () => {
    let service: HelpService;
    let urls: Urls;
    let overlayRef: jasmine.SpyObj<OverlayRef>;

    beforeEach(() => {
        const position = jasmine.createSpyObj(
            'position',
            ['global', 'top', 'right']
        );

        position.global.and.returnValue(position);
        position.top.and.returnValue(position);
        position.right.and.returnValue(position);

        overlayRef = jasmine.createSpyObj<OverlayRef>(
            'OverlayRef',
            [
                'attach',
                'detach',
                'dispose',
                'keydownEvents',
                'detachments'
            ]
        );

        overlayRef.keydownEvents.and.returnValue(of());
        overlayRef.detachments.and.returnValue(of());

        const overlay = jasmine.createSpyObj<Overlay>(
            'Overlay',
            ['position', 'create']
        );

        overlay.position.and.returnValue(position);
        overlay.create.and.returnValue(overlayRef);

        TestBed.configureTestingModule({
            providers: [
                HelpService,
                { provide: Overlay, useValue: overlay },
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
        service.openHelp('quiz-help');

        expect(overlayRef.attach).toHaveBeenCalledTimes(1);
    });

    it('closes the help overlay', () => {
        service.openHelp('quiz-help');

        service.closeHelp();

        expect(overlayRef.detach).toHaveBeenCalledTimes(1);
        expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
    });
});
