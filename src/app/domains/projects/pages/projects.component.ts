import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardComponent, CardBodyComponent, CardHeaderComponent } from '../../../shared/ui/card.component';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'archived';
  createdAt: Date;
  members: number;
  apiCalls: number;
  storage: number;
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, CardComponent, CardBodyComponent],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="section-header">Projects</h1>
          <p class="section-subheader mt-2">Manage and organize your projects</p>
        </div>
        <button class="btn-primary">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>
    
      <!-- Search and Filter -->
      <app-card>
        <app-card-body class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Search Projects
              </label>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by name or description..."
                class="input-field"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Status
                </label>
                <select [(ngModel)]="selectedStatus" class="input-field">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Sort By
                </label>
                <select [(ngModel)]="sortBy" class="input-field">
                  <option value="recent">Recently Created</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="activity">Most Active</option>
                </select>
              </div>
            </div>
          </app-card-body>
        </app-card>
    
        <!-- Projects Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (project of filteredProjects(); track project) {
            <div class="card hover:shadow-lg transition-shadow cursor-pointer group">
              <app-card-body class="space-y-4">
                <!-- Header -->
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-50 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {{ project.name }}
                    </h3>
                    <p class="text-sm text-muted mt-1 line-clamp-2">{{ project.description }}</p>
                  </div>
              <span [ngClass]="{
                'badge-success': project.status === 'active',
                'badge-warning': project.status === 'paused',
                'badge-danger': project.status === 'archived'
              }" class="badge ml-2 flex-shrink-0">
                    {{ project.status }}
                  </span>
                </div>
                <!-- Stats -->
                <div class="grid grid-cols-3 gap-3 py-4 border-y border-neutral-200 dark:border-neutral-700">
                  <div>
                    <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Members</p>
                    <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ project.members }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">API Calls</p>
                    <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ formatNumber(project.apiCalls) }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-medium text-neutral-600 dark:text-neutral-400">Storage</p>
                    <p class="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{{ project.storage }}GB</p>
                  </div>
                </div>
                <!-- Footer -->
                <div class="flex items-center justify-between pt-2">
                  <p class="text-xs text-muted">Created {{ formatDate(project.createdAt) }}</p>
                  <button class="text-primary-600 hover:text-primary-700 text-sm font-medium dark:text-primary-400">
                    View →
                  </button>
                </div>
              </app-card-body>
            </div>
          }
        </div>
    
        <!-- Empty State -->
        @if (filteredProjects().length === 0) {
          <div class="card text-center py-16">
            <div class="mb-6">
              <svg class="w-16 h-16 text-neutral-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8-4m-8 4v10l8-4m0-10l-8-4" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">No projects found</h3>
            <p class="text-muted mb-6">Try adjusting your filters or create a new project to get started</p>
            <button class="btn-primary mx-auto">
              Create First Project
            </button>
          </div>
        }
    
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <app-card>
            <app-card-body>
              <p class="text-muted text-sm mb-2">Total Projects</p>
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">{{ getTotalProjects() }}</p>
            </app-card-body>
          </app-card>
          <app-card>
            <app-card-body>
              <p class="text-muted text-sm mb-2">Active Projects</p>
              <p class="text-3xl font-bold text-success-600 dark:text-success-400">
                {{ getActiveProjectsCount() }}
              </p>
            </app-card-body>
          </app-card>
          <app-card>
            <app-card-body>
              <p class="text-muted text-sm mb-2">Total API Calls</p>
              <p class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                {{ getTotalApiCalls() }}
              </p>
            </app-card-body>
          </app-card>
        </div>
      </div>
    `,
})
export class ProjectsComponent {
  searchQuery = signal('');
  selectedStatus = signal('');
  sortBy = signal('recent');

  allProjects = signal<Project[]>([
    {
      id: '1',
      name: 'E-Commerce Platform',
      description: 'Full-stack e-commerce application with payment integration and real-time inventory management',
      status: 'active',
      createdAt: new Date('2024-03-15'),
      members: 8,
      apiCalls: 2500000,
      storage: 45,
    },
    {
      id: '2',
      name: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard for business intelligence and data visualization',
      status: 'active',
      createdAt: new Date('2024-02-10'),
      members: 5,
      apiCalls: 1200000,
      storage: 28,
    },
    {
      id: '3',
      name: 'Mobile App Backend',
      description: 'RESTful API backend for iOS and Android mobile applications',
      status: 'active',
      createdAt: new Date('2024-01-20'),
      members: 12,
      apiCalls: 3800000,
      storage: 67,
    },
    {
      id: '4',
      name: 'CRM System',
      description: 'Customer relationship management system with automation workflows',
      status: 'paused',
      createdAt: new Date('2023-12-05'),
      members: 6,
      apiCalls: 450000,
      storage: 15,
    },
    {
      id: '5',
      name: 'Content Management',
      description: 'Headless CMS for managing and publishing digital content across channels',
      status: 'active',
      createdAt: new Date('2023-11-18'),
      members: 4,
      apiCalls: 900000,
      storage: 32,
    },
    {
      id: '6',
      name: 'Legacy System Migration',
      description: 'Migrating legacy systems to cloud infrastructure',
      status: 'archived',
      createdAt: new Date('2023-09-30'),
      members: 10,
      apiCalls: 150000,
      storage: 8,
    },
  ]);

  filteredProjects = (): Project[] => {
    let filtered = this.allProjects().filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
        project.description.toLowerCase().includes(this.searchQuery().toLowerCase());

      const matchesStatus =
        this.selectedStatus() === '' || project.status === this.selectedStatus();

      return matchesSearch && matchesStatus;
    });

    // Sort
    if (this.sortBy() === 'name') {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (this.sortBy() === 'activity') {
      filtered = filtered.sort((a, b) => b.apiCalls - a.apiCalls);
    } else {
      // recent (default)
      filtered = filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    return filtered;
  };

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months !== 1 ? 's' : ''} ago`;
    }

    return date.toLocaleDateString();
  }

  getTotalProjects(): number {
    return this.allProjects().length;
  }

  getActiveProjectsCount(): number {
    return this.allProjects().filter((p) => p.status === 'active').length;
  }

  getTotalApiCalls(): string {
    const total = this.allProjects().reduce((sum, p) => sum + p.apiCalls, 0);
    return this.formatNumber(total);
  }
}
