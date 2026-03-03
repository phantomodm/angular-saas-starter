import { TestBed } from '@angular/core/testing';

import { Regime } from './regime';

describe('Regime', () => {
  let service: Regime;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Regime);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
