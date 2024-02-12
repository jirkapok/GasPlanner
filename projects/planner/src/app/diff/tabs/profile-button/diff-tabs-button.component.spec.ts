import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiffTabsButtonComponent } from './diff-tabs-button.component';

describe('DiffTabsButtonComponent', () => {
    let component: DiffTabsButtonComponent;
    let fixture: ComponentFixture<DiffTabsButtonComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiffTabsButtonComponent]
        });
        fixture = TestBed.createComponent(DiffTabsButtonComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
