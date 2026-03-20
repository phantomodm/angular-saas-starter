import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollapseGauge } from './collapse-gauge';

describe('CollapseGauge', () => {
  let component: CollapseGauge;
  let fixture: ComponentFixture<CollapseGauge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapseGauge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollapseGauge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
