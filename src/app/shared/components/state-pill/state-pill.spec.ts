import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatePill } from './state-pill';

describe('StatePill', () => {
  let component: StatePill;
  let fixture: ComponentFixture<StatePill>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatePill]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatePill);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
