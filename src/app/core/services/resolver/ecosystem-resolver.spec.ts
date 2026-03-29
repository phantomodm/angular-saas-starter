import { TestBed } from '@angular/core/testing';
import { ResolveFn } from '@angular/router';

import { ecosystemResolver } from './ecosystem-resolver';

describe('ecosystemResolver', () => {
  const executeResolver: ResolveFn<boolean> = (...resolverParameters) => 
      TestBed.runInInjectionContext(() => ecosystemResolver(...resolverParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeResolver).toBeTruthy();
  });
});
