import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrendArrow } from './trend-arrow';

describe('TrendArrow', () => {
  let component: TrendArrow;
  let fixture: ComponentFixture<TrendArrow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendArrow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrendArrow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
