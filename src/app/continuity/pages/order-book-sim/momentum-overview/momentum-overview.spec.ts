import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MomentumOverview } from './momentum-overview';

describe('MomentumOverview', () => {
  let component: MomentumOverview;
  let fixture: ComponentFixture<MomentumOverview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MomentumOverview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MomentumOverview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
