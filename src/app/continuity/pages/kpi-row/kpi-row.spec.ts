import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KpiRow } from './kpi-row';

describe('KpiRow', () => {
  let component: KpiRow;
  let fixture: ComponentFixture<KpiRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KpiRow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
