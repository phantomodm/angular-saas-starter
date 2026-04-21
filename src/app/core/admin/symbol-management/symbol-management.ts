import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface SymbolRow {
  symbol: string;
  weight: number;
  volatility?: number;
  continuity?: number;
}

@Component({
  selector: 'app-symbol-management',
 imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './symbol-management.html',
  styleUrl: './symbol-management.scss',
})
export class SymbolManagement implements OnInit {
  private http = inject(HttpClient);

  instanceId = 'ecosys_12345'; // Replace with actual workspace context

  loading = signal(true);
  symbols = signal<SymbolRow[]>([]);

  newSymbol = signal('');
  newWeight = signal(1.0);

  displayedColumns = ['symbol', 'weight', 'volatility', 'continuity', 'actions'];

  async ngOnInit() {
    await this.loadSymbols();
  }

  async loadSymbols() {
    this.loading.set(true);

    const res = await this.http
      .get<SymbolRow[]>(`/api/symbols/list?instance_id=${this.instanceId}`)
      .toPromise();

    this.symbols.set(res || []);
    this.loading.set(false);
  }

  async addSymbol() {
    const payload = {
      symbol: this.newSymbol().toUpperCase(),
      name: this.newSymbol().toUpperCase(),
      instance_id: this.instanceId,
    };

    await this.http.post('/api/symbols/add', payload).toPromise();

    this.newSymbol.set('');
    this.newWeight.set(1.0);

    await this.loadSymbols();
  }

  async removeSymbol(symbol: string) {
    await this.http.delete(`/api/symbols/remove?instance_id=${this.instanceId}&symbol=${symbol}`).toPromise();
    await this.loadSymbols();
  }
}
