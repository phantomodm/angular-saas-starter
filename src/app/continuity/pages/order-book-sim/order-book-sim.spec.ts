import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderBookSim } from './order-book-sim';

describe('OrderBookSim', () => {
  let component: OrderBookSim;
  let fixture: ComponentFixture<OrderBookSim>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderBookSim]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderBookSim);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
