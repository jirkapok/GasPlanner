import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DiffComponent } from './diff.component';

describe('DiffComponent', () => {
    let component: DiffComponent;
    let fixture: ComponentFixture<DiffComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DiffComponent]
        });
        fixture = TestBed.createComponent(DiffComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
