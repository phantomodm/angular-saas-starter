import { TestBed } from '@angular/core/testing';

import { Sentry } from './sentry';

describe('Sentry', () => {
  let service: Sentry;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sentry);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
