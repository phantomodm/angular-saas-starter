import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-card',
  standalone: true,
  template: `<div class="card"><ng-content></ng-content></div>`,
})
export class CardComponent {}

@Component({
  selector: 'app-card-header',
  standalone: true,
  template: `<div class="card-header"><ng-content></ng-content></div>`,
})
export class CardHeaderComponent {}

@Component({
  selector: 'app-card-body',
  standalone: true,
  template: `<div class="card-body"><ng-content></ng-content></div>`,
})
export class CardBodyComponent {}

@Component({
  selector: 'app-card-footer',
  standalone: true,
  template: `<div class="card-footer"><ng-content></ng-content></div>`,
})
export class CardFooterComponent {}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CardComponent, CardBodyComponent],
  template: `
    <app-card class="block">
      <app-card-body>
        <p class="text-muted text-sm mb-2">{{ label }}</p>
        <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">{{ value }}</p>
        @if (change !== undefined) {
          <p [class]="change > 0 ? 'text-success' : 'text-danger'" class="text-sm">
            <span>{{ change > 0 ? '+' : '' }}{{ change }}%</span>
            <span class="text-muted ml-1">vs last month</span>
          </p>
        }
      </app-card-body>
    </app-card>
    `,
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() change?: number;
}
