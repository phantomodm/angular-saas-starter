import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniHeatmap } from './mini-heatmap';

describe('MiniHeatmap', () => {
  let component: MiniHeatmap;
  let fixture: ComponentFixture<MiniHeatmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiniHeatmap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniHeatmap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
