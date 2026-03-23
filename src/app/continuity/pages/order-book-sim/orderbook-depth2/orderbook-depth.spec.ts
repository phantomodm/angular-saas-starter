import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderbookDepth } from './orderbook-depth';

describe('OrderbookDepth', () => {
  let component: OrderbookDepth;
  let fixture: ComponentFixture<OrderbookDepth>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderbookDepth]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderbookDepth);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
