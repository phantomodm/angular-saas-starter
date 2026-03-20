import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradeTape } from './trade-tape';

describe('TradeTape', () => {
  let component: TradeTape;
  let fixture: ComponentFixture<TradeTape>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeTape]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradeTape);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
