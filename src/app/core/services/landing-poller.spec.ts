import { TestBed } from '@angular/core/testing';

import { LandingPoller } from './landing-poller';

describe('LandingPoller', () => {
  let service: LandingPoller;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingPoller);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
