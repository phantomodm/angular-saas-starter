import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'ce-header',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatSelectModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  @Input() nodeTypes: string[] = [];
  @Input() nodes: string[] = [];
  @Input() selectedCategory = '';
  @Input() selectedSymbol = '';
  @Input() lastUpdated = 'N/A';

  @Output() categoryChange = new EventEmitter<string>();
  @Output() symbolChange = new EventEmitter<string>();

  onCategoryChange(value: string) {
    this.categoryChange.emit(value);
  }

  onSymbolChange(value: string) {
    this.symbolChange.emit(value);
  }
}
