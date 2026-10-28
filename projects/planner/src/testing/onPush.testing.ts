import { ChangeDetectionStrategy, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

type ParentDefinitions = { parent: object; key: string; descriptor?: PropertyDescriptor }[];

// definitions compiled by JIT for parents, which aren't directives, like Streamed (@Injectable)
const parentDefinitionKeys = ['ɵfac', 'ɵdir'];

const parentsOf = (component: Type<unknown>): object[] => {
    const parents: object[] = [];
    let parent = Object.getPrototypeOf(component) as object | null;

    while (parent && parent !== Function.prototype) {
        parents.push(parent);
        parent = Object.getPrototypeOf(parent) as object | null;
    }

    return parents;
};

const saveParentDefinitions = (component: Type<unknown>): ParentDefinitions =>
    parentsOf(component).flatMap(parent => parentDefinitionKeys.map(key => ({
        parent,
        key,
        descriptor: Object.getOwnPropertyDescriptor(parent, key)
    })));

const restoreParentDefinitions = (saved: ParentDefinitions): void => {
    for (const { parent, key, descriptor } of saved) {
        if (descriptor) {
            Object.defineProperty(parent, key, descriptor);
        } else {
            Reflect.deleteProperty(parent, key);
        }
    }
};

/**
 * Renders the component with OnPush change detection and automatic change detection, as in the running app.
 * Configure the TestBed providers before calling it, but don't inject anything before (TestBed can't override then).
 * Change the state outside Angular events and await fixture.whenStable() to verify, that the view notices it.
 * Children stay with their own strategy, list the children in onPushChildren to verify also inputs passed to them.
 */
export async function renderOnPush<T>(
    component: Type<T>,
    inputs: Record<string, unknown> = {},
    onPushChildren: Type<unknown>[] = []
): Promise<ComponentFixture<T>> {
    const overridden = [component, ...onPushChildren];
    // The overridden component is compiled by JIT, which adds getter only definitions to its parents not being a directive.
    // Spec files share the modules, so other classes extending the parent would fail to assign their own AOT definitions.
    const savedDefinitions = overridden.flatMap(c => saveParentDefinitions(c));

    try {
        overridden.forEach(c => TestBed.overrideComponent(c, { set: { changeDetection: ChangeDetectionStrategy.OnPush } }));
        const fixture = TestBed.createComponent(component);

        for (const [name, value] of Object.entries(inputs)) {
            fixture.componentRef.setInput(name, value);
        }

        fixture.autoDetectChanges();
        await fixture.whenStable();
        return fixture;
    } finally {
        restoreParentDefinitions(savedDefinitions);
    }
}
