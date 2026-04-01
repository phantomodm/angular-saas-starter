import { Component, effect, EventEmitter, input, Input, OnInit, Output } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'ce-header',
  standalone: true,
  imports: [
    MatCardModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule
],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header implements OnInit {
  nodeTypes = input<string[]>([]);
  nodes = input<string[]>([]);
  selectedCategory = input<string>('');
  selectedSymbol = input<string>('N/A');
  lastUpdated = input<string>('N/A');

  @Output() categoryChange = new EventEmitter<string>();
  @Output() symbolChange = new EventEmitter<string>();

  constructor(){
    effect(() => {
      const symbol = this.selectedSymbol();
      const category = this.selectedCategory();
      console.log('Header detected change - Category:', category, 'Symbol:', symbol);
      if (symbol && category) {
        
      }
    })
  }

  onCategoryChange(value: string) {
    this.categoryChange.emit(value);
  }

  onSymbolChange(value: string) {
    this.symbolChange.emit(value);
  }

  ngOnInit() {
    // Initialization logic if needed
    console.log('Header component initialized with categories:', this.nodeTypes());
    console.log('Header component initialized with symbols:', this.nodes());
  }
}
