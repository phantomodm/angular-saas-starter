import { Component, inject, input, Input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { Continuity } from '../../../core/services/continuity';
import { ForecastData } from '../../../core/models/types';

@Component({
  selector: 'ce-forecast-table',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule],
  templateUrl: './forecast-table.html',
  styleUrls: ['./forecast-table.scss'],
})
export class ForecastTable implements OnChanges {
  private continuity = inject(Continuity);

  symbol = input<string>('');
  rows = signal<any[]>([]);
  loading = signal(false);

  displayedColumns = ['date', 'c', 't', 'a'];

  constructor() {}

  async ngOnChanges() {
    if (!this.symbol) return;

    this.loading.set(true);

    const data: ForecastData = await this.continuity.getForecast(this.symbol());

    this.rows.set(data.forecast ?? []);
    this.loading.set(false);
  }
}