import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExplanationPanel } from './explanation-panel';

describe('ExplanationPanel', () => {
  let component: ExplanationPanel;
  let fixture: ComponentFixture<ExplanationPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExplanationPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExplanationPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
