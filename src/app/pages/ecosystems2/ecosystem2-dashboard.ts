import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';


import {
  IngestionService,
  ContinuityIndex,
} from '../../core/services/new/ingestion';
import {
  ContinuityCoreService,
  ResilienceMetric,
} from '../../core/services/new/continuity-core';
import { EcosystemStore } from '../../core/store/ecosystem.store';
import { AlertService } from '../../core/services/new/alert';
import {
  EcosystemInstance,
  EcosystemLibraryService,
} from '../../core/services/ecosystem-library';
import { EcosystemEngineService, EcosystemTemplate } from '../../core/services/ecosystem-engine';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 md:mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Ecosystems</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Manage your workspace ecosystems and templates
          </p>
        </div>


        <button
          mat-flat-button
          color="primary"
          (click)="browseTemplates()"
          class="flex items-center gap-2"
        >
          <mat-icon>library_add</mat-icon>
          Add From Library
        </button>
      </div>


      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Active Ecosystem Instances -->
        <mat-card>
          <mat-card-header>
            <mat-card-title class="text-lg font-semibold">
              Active Ecosystems
            </mat-card-title>
          </mat-card-header>


          <mat-card-content class="pt-4 space-y-4">
            @if (activeInstances.length === 0) {
              <p class="text-gray-600 dark:text-gray-400 text-center py-6">
                No active ecosystems yet
              </p>
            }


            @for (instance of activeInstances; track instance.id) {
              <div
                class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                (click)="selectEcosystem(instance)"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-semibold text-lg">{{ instance.name }}</div>
                    <div class="text-xs text-gray-500">
                      Created: {{ instance.createdAt | date: 'short' }}
                    </div>
                  </div>


                  <div class="flex items-center gap-3">
                    <!-- Status Chip -->
                    <mat-chip
                      [ngClass]="getStatusChipClass(instance.status)"
                      class="px-3 py-1 text-xs font-semibold"
                    >
                      {{ instance.status | uppercase }}
                    </mat-chip>


                    <!-- Toggle -->
                    <button
                      mat-icon-button
                      (click)="
                        toggleEcosystem($event, instance.id, instance.status)
                      "
                    >
                      <mat-icon>
                        {{
                          instance.status === 'active' ? 'pause' : 'play_arrow'
                        }}
                      </mat-icon>
                    </button>


                    <!-- Delete -->
                    <button
                      mat-icon-button
                      color="warn"
                      (click)="deleteEcosystem($event, instance.id)"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>


        <!-- Workspace Templates -->
        <mat-card>
          <mat-card-header>
            <mat-card-title class="text-lg font-semibold">
              Workspace Templates
            </mat-card-title>
          </mat-card-header>


          <mat-card-content class="pt-4">
            <!-- Search + Category Filter -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Search Templates</mat-label>
                <input
                  matInput
                  [value]="searchQuery()"
                  (input)="
                    searchQuery.set($event.target.value); onSearchChange()
                  "
                />
                <button
                  matSuffix
                  mat-icon-button
                  *ngIf="searchQuery()"
                  (click)="searchQuery.set(''); onSearchChange()"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </mat-form-field>


              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Category</mat-label>
                <mat-select
                  [value]="selectedCategory()"
                  (selectionChange)="
                    selectedCategory.set($event.value); onCategoryChange()
                  "
                >
                  <mat-option value="">All</mat-option>
                  <mat-option value="macro">Macro</mat-option>
                  <mat-option value="credit">Credit</mat-option>
                  <mat-option value="rates">Rates</mat-option>
                  <mat-option value="fx">FX</mat-option>
                  <mat-option value="equity">Equity</mat-option>
                </mat-select>
              </mat-form-field>
            </div>


            <!-- Template List -->
            <div class="space-y-4 max-h-[500px] overflow-y-auto">
              @if (filteredTemplates.length === 0) {
                <p class="text-gray-600 dark:text-gray-400 text-center py-6">
                  No templates found
                </p>
              }


              @for (template of filteredTemplates; track template.id) {
                <div
                  class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-semibold text-lg">
                        {{ template.name }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ template.category | uppercase }} •
                        {{ template.complexity }}
                      </div>
                    </div>


                    <button
                      mat-icon-button
                      (click)="openCreateInstance(template)"
                    >
                      <mat-icon>add_circle</mat-icon>
                    </button>
                  </div>


                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {{ template.description }}
                  </p>


                  <div class="flex flex-wrap gap-2 mt-3">
                    @for (tag of template.tags; track tag) {
                      <span
                        class="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {{ tag }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>


      <!-- Global Template Library Modal -->
      @if (showTemplates()) {
        <div
          class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        >
          <mat-card class="w-full max-w-4xl p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Global Template Library</h2>
              <button mat-icon-button (click)="browseTemplates()">
                <mat-icon>close</mat-icon>
              </button>
            </div>


            <mat-form-field appearance="outline" class="w-full mb-4">
              <mat-label>Search Global Templates</mat-label>
              <input
                matInput
                [(ngModel)]="globalSearch"
                (input)="filterGlobalTemplates()"
              />
            </mat-form-field>


            <div class="max-h-[500px] overflow-y-auto space-y-4">
              @if (globalFiltered.length === 0) {
                <p class="text-gray-600 dark:text-gray-400 text-center py-6">
                  No templates found
                </p>
              }


              @for (template of globalFiltered; track template.id) {
                <div
                  class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="font-semibold text-lg">
                        {{ template.name }}
                      </div>
                      <div class="text-xs text-gray-500">
                        {{ template.category | uppercase }} •
                        {{ template.complexity }}
                      </div>
                    </div>


                    <button
                      mat-flat-button
                      color="primary"
                      (click)="addTemplateToWorkspace(template)"
                    >
                      Add
                    </button>
                  </div>


                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {{ template.description }}
                  </p>


                  <div class="flex flex-wrap gap-2 mt-3">
                    @for (tag of template.tags; track tag) {
                      <span
                        class="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {{ tag }}
                      </span>
                    }
                  </div>
                </div>
              }
            </div>
          </mat-card>
        </div>
      }


      <!-- Create Ecosystem Instance Modal -->
      @if (showCreateInstance) {
        <div
          class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        >
          <mat-card class="w-full max-w-md p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-semibold">Create Ecosystem Instance</h2>
              <button mat-icon-button (click)="closeCreateInstance()">
                <mat-icon>close</mat-icon>
              </button>
            </div>


            <mat-form-field appearance="outline" class="w-full mb-4">
              <mat-label>Instance Name</mat-label>
              <input matInput [(ngModel)]="newInstanceName" />
            </mat-form-field>


            <button
              mat-flat-button
              color="primary"
              class="w-full"
              (click)="createInstance()"
            >
              Create
            </button>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [
    `
      ::ng-deep .resilience-bar-healthy .mdc-linear-progress__bar {
        background-color: #4caf50;
      }


      ::ng-deep .resilience-bar-moderate .mdc-linear-progress__bar {
        background-color: #ff9800;
      }


      ::ng-deep .resilience-bar-low .mdc-linear-progress__bar {
        background-color: #f44336;
      }


      mat-card {
        background-color: var(--surface-container);
        border-radius: 12px;
      }


      ::ng-deep .mat-mdc-form-field {
        width: 100%;
      }
    `,
  ],
})
export class EcosystemsMaterial2 implements OnInit {
  private library = inject(EcosystemLibraryService);
  private engine = inject(EcosystemEngineService);


  showTemplates = signal(false);
  showCreateInstance = false;


  searchQuery = signal('');
  selectedCategory = signal('');


  activeInstances: EcosystemInstance[] = [];
  filteredTemplates: EcosystemTemplate[] = [];


  globalTemplates: EcosystemTemplate[] = [];
  globalFiltered: EcosystemTemplate[] = [];
  globalSearch = '';


  selectedTemplateForInstance?: EcosystemTemplate;
  newInstanceName = '';


  ngOnInit(): void {
    this.loadWorkspaceInstances();
    this.loadWorkspaceTemplates();


    this.engine.getTemplates().subscribe((templates) => {
      this.globalTemplates = templates;
      this.globalFiltered = templates;
    });
  }


  /* Workspace Instances */
  private loadWorkspaceInstances(): void {
    const workspaceId = 'workspace001';


    this.library.loadWorkspaceInstances(workspaceId);


    effect(() => {
      this.activeInstances = this.library
        .workspaceInstances()
        .filter((i) => i.status === 'active');
    });
  }


  /* Workspace Templates */
  private loadWorkspaceTemplates(): void {
    const workspaceId = 'workspace001';


    this.library.loadWorkspaceTemplates(workspaceId);


    effect(() => {
      this.filteredTemplates = this.library.workspaceTemplates();
    });
  }


  /* Global Template Modal */
  browseTemplates(): void {
    this.showTemplates.update((v) => !v);
  }


  filterGlobalTemplates() {
    const q = this.globalSearch.toLowerCase();


    this.globalFiltered = this.globalTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    );
  }


  addTemplateToWorkspace(template: EcosystemTemplate) {
    const workspaceId = 'workspace001';


    this.library.addTemplateToWorkspace(workspaceId, template).then(() => {
      this.loadWorkspaceTemplates();
      this.browseTemplates();
    });
  }


  /* Create Instance Modal */
  openCreateInstance(template: EcosystemTemplate) {
    this.selectedTemplateForInstance = template;
    this.newInstanceName = template.name + ' Instance';
    this.showCreateInstance = true;
  }


  closeCreateInstance() {
    this.showCreateInstance = false;
  }


  createInstance() {
    const workspaceId = 'workspace001';


    this.library
      .createWorkspaceInstance(
        workspaceId,
        this.selectedTemplateForInstance!.id,
        this.newInstanceName,
      )
      .then(() => {
        this.showCreateInstance = false;
        this.loadWorkspaceInstances();
      });
  }


  /* Search + Filter */
  onSearchChange(): void {
    const query = this.searchQuery().toLowerCase();


    if (!query.trim()) {
      this.filteredTemplates = this.library.workspaceTemplates();
      return;
    }


    this.filteredTemplates = this.library
      .workspaceTemplates()
      .filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
  }


  onCategoryChange(): void {
    const category = this.selectedCategory();


    if (!category) {
      this.filteredTemplates = this.library.workspaceTemplates();
      return;
    }


    this.filteredTemplates = this.library
      .workspaceTemplates()
      .filter((t) => t.category === category);
  }


  /* Instance Actions */
  selectEcosystem(instance: EcosystemInstance): void {
    this.library.selectEcosystem(instance);
  }


  toggleEcosystem(
    event: Event,
    instanceId: string,
    currentStatus: string,
  ): void {
    event.stopPropagation();


    const workspaceId = 'workspace001';
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';


    this.library.updateInstanceStatus(workspaceId, instanceId, newStatus);
  }


  deleteEcosystem(event: Event, instanceId: string): void {
    event.stopPropagation();


    if (confirm('Are you sure you want to delete this ecosystem?')) {
      const workspaceId = 'workspace001';
      this.library.deleteWorkspaceInstance(workspaceId, instanceId);
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
