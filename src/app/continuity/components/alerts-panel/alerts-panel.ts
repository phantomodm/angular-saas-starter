import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AlertItem } from '../../../core/models/types';

@Component({
  selector: 'ce-alerts-panel',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './alerts-panel.html',
  styleUrls: ['./alerts-panel.scss'],
})
export class AlertsPanel {
  @Input() alerts: AlertItem[] = [];
  @Input() symbol = '';

  sorted = computed(() =>
    [...this.alerts].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  );

  colorFor(severity: string) {
    switch (severity) {
      case 'High':
        return '#dc2626';
      case 'Medium':
        return '#f97316';
      case 'Low':
        return '#eab308';
      default:
        return '#6b7280';
    }
  }
}
