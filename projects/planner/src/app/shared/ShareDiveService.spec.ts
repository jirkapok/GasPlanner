import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ClipboardService, IClipboardResponse } from 'ngx-clipboard';
import { MdbModalService } from 'mdb-angular-ui-kit/modal';
import { MockInstance } from 'vitest';
import { ShareDiveService } from './ShareDiveService';
import { ViewRefresh } from './viewRefresh';
import { createSpyObj } from '../../testing/spy-testing.helpers';

describe('ShareDiveService', () => {
    let sut: ShareDiveService;
    let copyResponse: Subject<IClipboardResponse>;
    let refresh: MockInstance<() => void>;

    beforeEach(() => {
        vi.useFakeTimers();
        copyResponse = new Subject<IClipboardResponse>();
        const clipboard = { copyResponse$: copyResponse.asObservable(), copy: vi.fn() };

        TestBed.configureTestingModule({
            providers: [
                ShareDiveService,
                { provide: ClipboardService, useValue: clipboard },
                { provide: MdbModalService, useValue: createSpyObj<MdbModalService>(['open']) }
            ]
        });

        sut = TestBed.inject(ShareDiveService);
        refresh = vi.spyOn(TestBed.inject(ViewRefresh), 'refresh').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Refreshes view when toast is shown', () => {
        copyResponse.next({ isSuccess: true });

        expect(sut.toastVisible).toBe(true);
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('Refreshes view when toast hides', () => {
        copyResponse.next({ isSuccess: true });
        refresh.mockClear();

        vi.advanceTimersByTime(5000);

        expect(sut.toastVisible).toBe(false);
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('Does not show toast for failed copy', () => {
        copyResponse.next({ isSuccess: false });

        expect(sut.toastVisible).toBe(false);
        expect(refresh).not.toHaveBeenCalled();
    });
});
