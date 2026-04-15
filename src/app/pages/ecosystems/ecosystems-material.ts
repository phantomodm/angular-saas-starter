// EcosystemsMaterialComponent - migrated from ecosystems.txt
import { Component, inject, OnInit, signal } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import {
  EcosystemLibraryService,
  EcosystemTemplate,
  EcosystemInstance,
} from './ecosystem-library';

@Component({
  selector: 'app-ecosystems',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatGridListModule,
    MatTooltipModule,
    MatBadgeModule,
    MatProgressBarModule,
    MatDialogModule,
    MatListModule,
    MatDividerModule
],
  template: ` ...existing code from ecosystems.txt template... `,
  styles: [],
})
export class EcosystemsMaterial implements OnInit {
  ecosystemService = inject(EcosystemLibraryService);
  showTemplates = signal(false);
  searchQuery = signal('');
  selectedCategory = signal('');

  activeInstances: EcosystemInstance[] = [];
  filteredTemplates: EcosystemTemplate[] = [];

  ngOnInit(): void {
    this.loadInstances();
    this.loadTemplates();
  }

  private loadInstances(): void {
    this.ecosystemService.getInstances().subscribe((instances) => {
      this.activeInstances = instances.filter((i) => i.status === 'active');
    });
  }

  private loadTemplates(): void {
    this.ecosystemService.getTemplates().subscribe((templates) => {
      this.filteredTemplates = templates;
    });
  }

  browseTemplates(): void {
    this.showTemplates.update((v) => !v);
  }

  viewTemplate(template: EcosystemTemplate): void {
    // Can add dialog here for more details
  }

  onSearchChange(): void {
    const query = this.searchQuery();
    if (query.trim()) {
      this.filteredTemplates = this.ecosystemService.searchTemplates(query);
    } else {
      this.loadTemplates();
    }
  }

  onCategoryChange(): void {
    const category = this.selectedCategory();
    if (category) {
      this.filteredTemplates = this.ecosystemService.filterByCategory(category);
    } else {
      this.loadTemplates();
    }
  }

  selectEcosystem(instance: EcosystemInstance): void {
    this.ecosystemService.selectEcosystem(instance.id);
  }

  toggleEcosystem(
    event: Event,
    instanceId: string,
    currentStatus: string,
  ): void {
    event.stopPropagation();
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    this.ecosystemService.updateStatus(instanceId, newStatus);
    this.loadInstances();
  }

  deleteEcosystem(event: Event, instanceId: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this ecosystem?')) {
      this.ecosystemService.deleteInstance(instanceId);
      this.loadInstances();
    }
  }

  getStatusChipClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-100 dark:bg-green-900',
      paused: 'bg-amber-100 dark:bg-amber-900',
      archived: 'bg-red-100 dark:bg-red-900',
    };
    return classes[status] || '';
  }
}
