import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MicrostructureCharts } from './microstructure-charts';

describe('MicrostructureCharts', () => {
  let component: MicrostructureCharts;
  let fixture: ComponentFixture<MicrostructureCharts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MicrostructureCharts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MicrostructureCharts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
