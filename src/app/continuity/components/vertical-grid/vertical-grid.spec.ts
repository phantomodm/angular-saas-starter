import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalGrid } from './vertical-grid';

describe('VerticalGrid', () => {
  let component: VerticalGrid;
  let fixture: ComponentFixture<VerticalGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerticalGrid]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerticalGrid);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
