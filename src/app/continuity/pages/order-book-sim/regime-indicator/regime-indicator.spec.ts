import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegimeIndicator } from './regime-indicator';

describe('RegimeIndicator', () => {
  let component: RegimeIndicator;
  let fixture: ComponentFixture<RegimeIndicator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegimeIndicator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegimeIndicator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
