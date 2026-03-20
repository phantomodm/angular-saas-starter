import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SymbolSelector } from './symbol-selector';

describe('SymbolSelector', () => {
  let component: SymbolSelector;
  let fixture: ComponentFixture<SymbolSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SymbolSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
