import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CollapseAlerts } from './collapse-alerts';

describe('CollapseAlerts', () => {
  let component: CollapseAlerts;
  let fixture: ComponentFixture<CollapseAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollapseAlerts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CollapseAlerts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
