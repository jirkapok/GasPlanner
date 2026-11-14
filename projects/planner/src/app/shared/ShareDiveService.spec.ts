import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { ShareDiveService } from './ShareDiveService';
import { createSpyObj } from '../../testing/spy-testing.helpers';
import { renderOnPush } from '../../testing/onPush.testing';

@Component({
    selector: 'app-toast-host',
    template: '@if (share.toastVisible) { <span class="toast">copied</span> }'
})
class ToastHostComponent {
    constructor(public share: ShareDiveService) {
    }
}

describe('ShareDiveService', () => {
    let sut: ShareDiveService;
    let copyResponse: Subject<IClipboardResponse>;
    let fixture: ComponentFixture<ToastHostComponent>;

    const toast = (): Element | null => (fixture.nativeElement as HTMLElement).querySelector('.toast');

    beforeEach(async () => {
        // only the share timers, Angular scheduler still uses real animation frames
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        copyResponse = new Subject<IClipboardResponse>();
        const clipboard = { copyResponse$: copyResponse.asObservable(), copy: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ShareDiveService,
                { provide: ClipboardService, useValue: clipboard },
                { provide: MdbModalService, useValue: createSpyObj<MdbModalService>(['open']) }
            ]
        });

        fixture = await renderOnPush(ToastHostComponent);
        sut = TestBed.inject(ShareDiveService);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders toast shown by clipboard response outside Angular events', async () => {
        copyResponse.next({ isSuccess: true });
        await fixture.whenStable();

        expect(sut.toastVisible).toBe(true);
        expect(toast()).not.toBeNull();
    });

    it('renders toast hidden by timer outside Angular events', async () => {
        copyResponse.next({ isSuccess: true });
        await fixture.whenStable();
        expect(toast()).not.toBeNull();

        vi.advanceTimersByTime(5000);
        await fixture.whenStable();

        expect(sut.toastVisible).toBe(false);
        expect(toast()).toBeNull();
    });

    it('Does not show toast for failed copy', async () => {
        copyResponse.next({ isSuccess: false });
        await fixture.whenStable();

        expect(sut.toastVisible).toBe(false);
        expect(toast()).toBeNull();
    });
});
