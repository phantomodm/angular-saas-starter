import { TestBed } from '@angular/core/testing';

import { RateLimiting } from './rate-limiting';

describe('RateLimiting', () => {
  let service: RateLimiting;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RateLimiting);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
