import { Component, Injectable, OnDestroy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { renderOnPush } from './onPush.testing';

/** The same kind of parent as Streamed */
@Injectable()
abstract class InjectableParent implements OnDestroy {
    public destroyed = false;

    // the lifecycle hook makes JIT handle the parent as abstract directive
    public ngOnDestroy(): void {
        this.destroyed = true;
    }
}

@Component({
    selector: 'app-inherited',
    template: '<span>inherited</span>'
})
class InheritedComponent extends InjectableParent {
}

describe('renderOnPush', () => {
    it('keeps definitions of the injectable parent assignable', async () => {
        TestBed.configureTestingModule({ imports: [InheritedComponent] });
        const factoryBefore = Object.getOwnPropertyDescriptor(InjectableParent, 'ɵfac');

        const fixture = await renderOnPush(InheritedComponent);

        expect((fixture.nativeElement as HTMLElement).textContent).toBe('inherited');
        expect(Object.getOwnPropertyDescriptor(InjectableParent, 'ɵfac')).toEqual(factoryBefore);
        expect(Object.getOwnPropertyDescriptor(InjectableParent, 'ɵdir')).toBeUndefined();
    });
});
