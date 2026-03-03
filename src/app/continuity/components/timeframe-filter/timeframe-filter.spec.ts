import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeframeFilter } from './timeframe-filter';

describe('TimeframeFilter', () => {
  let component: TimeframeFilter;
  let fixture: ComponentFixture<TimeframeFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeframeFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeframeFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
