import { TestBed } from '@angular/core/testing';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, Subject } from 'rxjs';

import { HelpService } from './help.service';
import { LayoutService } from '../layout.service';
import { Urls } from '../navigation.service';

describe('HelpService', () => {
    let service: HelpService;
    let urls: Urls;
    let overlay: jasmine.SpyObj<Overlay>;
    let overlayRef: jasmine.SpyObj<OverlayRef>;
    let keydownEvents: Subject<KeyboardEvent>;

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

        keydownEvents = new Subject<KeyboardEvent>();

        overlayRef.keydownEvents.and.returnValue(
            keydownEvents.asObservable()
        );

        overlayRef.detachments.and.returnValue(of());

        overlay = jasmine.createSpyObj<Overlay>(
            'Overlay',
            ['position', 'create']
        );

        overlay.position.and.returnValue(position);
        overlay.create.and.returnValue(overlayRef);
        (overlay as any).scrollStrategies = {
            noop: jasmine.createSpy('noop').and.returnValue({})
        };

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

        expect(overlay.create).toHaveBeenCalledTimes(1);
        expect(overlayRef.attach).toHaveBeenCalledTimes(1);
    });

    it('closes the help overlay when closeHelp is called', () => {
        service.openHelp('quiz-help');

        service.closeHelp();

        expect(overlay.create).toHaveBeenCalledTimes(1);
        expect(overlayRef.detach).toHaveBeenCalledTimes(1);
        expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
    });
});
