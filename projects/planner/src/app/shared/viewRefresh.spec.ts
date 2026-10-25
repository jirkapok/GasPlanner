import { ApplicationRef, ChangeDetectionStrategy, Component, ComponentRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ViewRefresh } from './viewRefresh';

@Component({
    selector: 'app-refreshed-child',
    template: '<span class="child">{{ state.value }}</span>',
    changeDetection: ChangeDetectionStrategy.Eager
})
class RefreshedChildComponent {
    public static readonly state = { value: 'initial' };
    public readonly state = RefreshedChildComponent.state;
}

@Component({
    selector: 'app-refreshed-root',
    imports: [RefreshedChildComponent],
    template: '<app-refreshed-child />',
    changeDetection: ChangeDetectionStrategy.Eager
})
class RefreshedRootComponent {
}

describe('ViewRefresh', () => {
    let sut: ViewRefresh;
    let appRef: ApplicationRef;
    let root: ComponentRef<RefreshedRootComponent>;
    let host: HTMLElement;

    const childText = (): string | null | undefined => host.querySelector('.child')?.textContent;

    beforeEach(async () => {
        RefreshedChildComponent.state.value = 'initial';
        host = document.createElement('app-refreshed-root');
        document.body.appendChild(host);
        sut = TestBed.inject(ViewRefresh);
        appRef = TestBed.inject(ApplicationRef);
        root = appRef.bootstrap(RefreshedRootComponent, host);
        await appRef.whenStable();
    });

    afterEach(() => {
        root.destroy();
        host.remove();
    });

    it('does not render state changed outside Angular events without refresh', async () => {
        RefreshedChildComponent.state.value = 'changed';
        await appRef.whenStable();
        expect(childText()).toBe('initial');
    });

    it('renders state of nested components changed outside Angular events', async () => {
        RefreshedChildComponent.state.value = 'changed';
        sut.refresh();
        await appRef.whenStable();
        expect(childText()).toBe('changed');
    });
});
