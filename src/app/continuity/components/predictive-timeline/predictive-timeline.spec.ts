import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictiveTimeline } from './predictive-timeline';

describe('PredictiveTimeline', () => {
  let component: PredictiveTimeline;
  let fixture: ComponentFixture<PredictiveTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictiveTimeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictiveTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
