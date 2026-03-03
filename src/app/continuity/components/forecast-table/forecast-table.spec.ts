import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactoryTable } from './forecast-table';

describe('FactoryTable', () => {
  let component: FactoryTable;
  let fixture: ComponentFixture<FactoryTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactoryTable],
    }).compileComponents();

    fixture = TestBed.createComponent(FactoryTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
