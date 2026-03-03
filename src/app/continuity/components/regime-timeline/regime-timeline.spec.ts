import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegimeTimeline } from './regime-timeline';

describe('RegimeTimeline', () => {
  let component: RegimeTimeline;
  let fixture: ComponentFixture<RegimeTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegimeTimeline]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegimeTimeline);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
