import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolitilityHeatmap } from './volitility-heatmap';

describe('VolitilityHeatmap', () => {
  let component: VolitilityHeatmap;
  let fixture: ComponentFixture<VolitilityHeatmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolitilityHeatmap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VolitilityHeatmap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
