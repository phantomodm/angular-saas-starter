import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeAttribution } from './node-attribution';

describe('NodeAttribution', () => {
  let component: NodeAttribution;
  let fixture: ComponentFixture<NodeAttribution>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeAttribution]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeAttribution);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
