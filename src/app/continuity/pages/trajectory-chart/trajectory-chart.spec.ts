import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrajectoryChart } from './trajectory-chart';

describe('TrajectoryChart', () => {
  let component: TrajectoryChart;
  let fixture: ComponentFixture<TrajectoryChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrajectoryChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrajectoryChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
