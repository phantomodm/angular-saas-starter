import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="section-header">{{ title }}</h1>
        <p class="section-subheader mt-2">{{ description }}</p>
      </div>

      <div class="card text-center py-16">
        <div class="mb-6">
          <div
            class="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto"
          >
            <svg
              class="w-8 h-8 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
        </div>
        <h2
          class="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-4"
        >
          Coming Soon
        </h2>
        <p class="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
          This section is being developed. Prompt NovaHuman to build this page
          with the specific features you need.
        </p>
        <p class="text-sm text-muted mb-8">
          You can extend this app by continuing to prompt with your
          requirements.
        </p>
      </div>
    </div>
  `,
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);

  title = this.route.snapshot.data['title'] || 'Page';
  description =
    this.route.snapshot.data['description'] || 'This page is under development';
}
