import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcosystemState } from './ecosystem-state';

describe('EcosystemState', () => {
  let component: EcosystemState;
  let fixture: ComponentFixture<EcosystemState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcosystemState]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcosystemState);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
