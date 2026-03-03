import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignalCards } from './signal-cards';

describe('SignalCards', () => {
  let component: SignalCards;
  let fixture: ComponentFixture<SignalCards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalCards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignalCards);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
