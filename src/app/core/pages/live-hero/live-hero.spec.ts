import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveHero } from './live-hero';

describe('LiveHero', () => {
  let component: LiveHero;
  let fixture: ComponentFixture<LiveHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveHero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveHero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
