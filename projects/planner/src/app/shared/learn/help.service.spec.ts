import { TestBed } from '@angular/core/testing';
import { Overlay, OverlayPositionBuilder, OverlayRef } from '@angular/cdk/overlay';
import { of, Subject } from 'rxjs';

import { HelpService } from './help.service';
import { LayoutService } from '../layout.service';
import { Urls } from '../navigation.service';
import { createSpyObj } from '../../../testing/spy-testing.helpers';
import { Mocked } from 'vitest';

describe('HelpService', () => {
    let service: HelpService;
    let urls: Urls;
    let overlay: Mocked<Overlay>;
    let overlayRef: Mocked<OverlayRef>;
    let keydownEvents: Subject<KeyboardEvent>;

    beforeEach(() => {
        const position = createSpyObj<Record<'global' | 'top' | 'right', () => unknown>>(
            ['global', 'top', 'right']
        );

        position.global.mockReturnValue(position);
        position.top.mockReturnValue(position);
        position.right.mockReturnValue(position);

        overlayRef = createSpyObj<OverlayRef>(
            [
                'attach',
                'detach',
                'dispose',
                'keydownEvents',
                'detachments'
            ]
        );

        keydownEvents = new Subject<KeyboardEvent>();

        overlayRef.keydownEvents.mockReturnValue(
            keydownEvents.asObservable()
        );

        overlayRef.detachments.mockReturnValue(of());

        overlay = createSpyObj<Overlay>(
            ['position', 'create']
        );

        overlay.position.mockReturnValue(position as unknown as OverlayPositionBuilder);
        overlay.create.mockReturnValue(overlayRef);
        (overlay as any).scrollStrategies = {
            noop: vi.fn().mockReturnValue({})
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

    it('closes the help overlay when Escape is pressed', () => {
        service.openHelp('quiz-help');

        const event = {
            key: 'Escape',
            preventDefault: vi.fn()
        } as unknown as KeyboardEvent;

        keydownEvents.next(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(overlayRef.detach).toHaveBeenCalledTimes(1);
        expect(overlayRef.dispose).toHaveBeenCalledTimes(1);
    });
});
