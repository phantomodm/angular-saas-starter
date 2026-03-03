import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinedSeriesChart } from './combined-series-chart';

describe('CombinedSeriesChart', () => {
  let component: CombinedSeriesChart;
  let fixture: ComponentFixture<CombinedSeriesChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombinedSeriesChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombinedSeriesChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
