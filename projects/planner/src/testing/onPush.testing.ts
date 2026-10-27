import { ChangeDetectionStrategy, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

/**
 * Renders the component with OnPush change detection and automatic change detection, as in the running app.
 * Configure the TestBed providers before calling it, but don't inject anything before (TestBed can't override then).
 * Change the state outside Angular events and await fixture.whenStable() to verify, that the view notices it.
 */
export async function renderOnPush<T>(component: Type<T>, inputs: Record<string, unknown> = {}): Promise<ComponentFixture<T>> {
    TestBed.overrideComponent(component, { set: { changeDetection: ChangeDetectionStrategy.OnPush } });
    const fixture = TestBed.createComponent(component);

    for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value);
    }

    fixture.autoDetectChanges();
    await fixture.whenStable();
    return fixture;
}
