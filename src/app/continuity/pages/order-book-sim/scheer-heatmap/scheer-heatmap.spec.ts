import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheerHeatmap } from './scheer-heatmap';

describe('ScheerHeatmap', () => {
  let component: ScheerHeatmap;
  let fixture: ComponentFixture<ScheerHeatmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheerHeatmap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheerHeatmap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
