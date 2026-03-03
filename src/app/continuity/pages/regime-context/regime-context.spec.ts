import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegimeContext } from './regime-context';

describe('RegimeContext', () => {
  let component: RegimeContext;
  let fixture: ComponentFixture<RegimeContext>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegimeContext]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegimeContext);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
