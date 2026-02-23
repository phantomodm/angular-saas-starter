import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { SupportArticle, SupportCategory } from '../../../core/models/organization.model';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-help-center',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-neutral-900 dark:to-neutral-800">
      <!-- Hero Section -->
      <div class="px-6 py-12 text-center">
        <h1 class="text-4xl font-bold text-neutral-900 dark:text-white mb-4">Help Center</h1>
        <p class="text-lg text-neutral-600 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
          Find answers to your questions and get support from our team
        </p>

        <!-- Search -->
        <div class="max-w-xl mx-auto mb-8">
          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="performSearch()"
              placeholder="Search help articles..."
              class="w-full px-4 py-3 pl-12 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
            />
            <svg
              class="absolute left-4 top-3.5 w-5 h-5 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="flex gap-3 justify-center flex-wrap">
          <button
            (click)="openSubmitTicket()"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Submit Support Ticket
          </button>
          <button
            (click)="selectedCategory.set(null)"
            class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
          >
            View All Articles
          </button>
        </div>
      </div>

      <div class="max-w-6xl mx-auto px-6 py-12">
        <!-- Categories Section -->
        @if (!selectedCategory() && searchQuery() === '') {
          <div class="mb-12">
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white mb-6">Browse by Category</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              @for (category of categories(); track category.id) {
                <button
                  (click)="selectedCategory.set(category.id)"
                  class="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 transition text-left"
                >
                  @if (category.icon) {
                    <div class="text-2xl mb-2">{{ category.icon }}</div>
                  }
                  <h3 class="font-semibold text-neutral-900 dark:text-white">{{ category.name }}</h3>
                  <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                    {{ category.description }}
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-500 mt-2">
                    {{ category.articleCount }} articles
                  </p>
                </button>
              }
            </div>
          </div>
        }

        <!-- Search Results -->
        @if (searchQuery() !== '') {
          <div>
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
              Search Results for "{{ searchQuery() }}"
              <span class="text-sm text-neutral-600 dark:text-neutral-400">({{ searchResults().length }})</span>
            </h2>

            @if (searchResults().length === 0) {
              <div class="text-center py-12">
                <p class="text-neutral-600 dark:text-neutral-400 mb-4">No articles found matching your search</p>
                <button
                  (click)="openSubmitTicket()"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Contact Support
                </button>
              </div>
            } @else {
              <div class="space-y-4">
                @for (article of searchResults(); track article.id) {
                  <div
                    (click)="selectedArticle.set(article)"
                    class="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition"
                  >
                    <h3 class="font-semibold text-neutral-900 dark:text-white">{{ article.title }}</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{{ article.description }}</p>
                    <div class="flex gap-2 mt-3">
                      <span class="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                        {{ article.category }}
                      </span>
                      <span class="text-xs text-neutral-500 dark:text-neutral-500">{{ article.views }} views</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Category Articles -->
        @if (selectedCategory() && searchQuery() === '') {
          <div>
            <button
              (click)="selectedCategory.set(null)"
              class="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center gap-2"
            >
              ← Back to Categories
            </button>

            <h2 class="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
              {{ getCategoryName() }}
            </h2>

            @if (categoryArticles().length === 0) {
              <p class="text-neutral-600 dark:text-neutral-400">No articles in this category</p>
            } @else {
              <div class="space-y-4">
                @for (article of categoryArticles(); track article.id) {
                  <div
                    (click)="selectedArticle.set(article)"
                    class="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition"
                  >
                    <h3 class="font-semibold text-neutral-900 dark:text-white">{{ article.title }}</h3>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{{ article.description }}</p>
                    <div class="flex justify-between items-center mt-3">
                      <span class="text-xs text-neutral-500 dark:text-neutral-500">{{ article.views }} views</span>
                      <div class="flex gap-2">
                        <span class="text-green-600 dark:text-green-400">👍 {{ article.helpful }}</span>
                        <span class="text-red-600 dark:text-red-400">👎 {{ article.unhelpful }}</span>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Article View -->
        @if (selectedArticle()) {
          <div>
            <button
              (click)="selectedArticle.set(null)"
              class="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center gap-2"
            >
              ← Back
            </button>

            <article class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-8">
              <div class="mb-6">
                <span class="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded mb-4">
                  {{ selectedArticle()!.category }}
                </span>
                <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                  {{ selectedArticle()!.title }}
                </h1>
                <p class="text-neutral-600 dark:text-neutral-400">{{ selectedArticle()!.description }}</p>
              </div>

              <div class="prose dark:prose-invert max-w-none mb-8 text-neutral-600 dark:text-neutral-400">
                {{ selectedArticle()!.content }}
              </div>

              <!-- Related Articles -->
              @if (selectedArticle()!.relatedArticles && selectedArticle()!.relatedArticles!.length > 0) {
                <div class="border-t border-neutral-200 dark:border-neutral-700 pt-8 mt-8">
                  <h3 class="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Related Articles</h3>
                  <div class="space-y-2">
                    @for (relatedId of selectedArticle()!.relatedArticles; track relatedId) {
                      @let relatedArticle = getArticleById(relatedId);
                      @if (relatedArticle) {
                        <a
                          (click)="selectedArticle.set(relatedArticle)"
                          class="block p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 transition cursor-pointer"
                        >
                          {{ relatedArticle.title }}
                        </a>
                      }
                    }
                  </div>
                </div>
              }

              <!-- Helpful Feedback -->
              <div class="border-t border-neutral-200 dark:border-neutral-700 pt-8 mt-8">
                <p class="text-neutral-900 dark:text-white font-medium mb-4">Was this article helpful?</p>
                <div class="flex gap-2">
                  <button
                    (click)="markHelpful(selectedArticle()!.id, true)"
                    class="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                  >
                    👍 Yes ({{ selectedArticle()!.helpful }})
                  </button>
                  <button
                    (click)="markHelpful(selectedArticle()!.id, false)"
                    class="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition"
                  >
                    👎 No ({{ selectedArticle()!.unhelpful }})
                  </button>
                </div>
              </div>
            </article>
          </div>
        }
      </div>

      <!-- Support Ticket Dialog -->
      @if (showTicketForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-white dark:bg-neutral-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-800">
              <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">Submit Support Ticket</h2>
              <button
                (click)="closeTicketForm()"
                class="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="ticketForm" (ngSubmit)="submitTicket()" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  formControlName="subject"
                  placeholder="Brief description of your issue"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Category *
                </label>
                <select
                  formControlName="category"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="general">General</option>
                  <option value="billing">Billing</option>
                  <option value="technical">Technical</option>
                  <option value="feature">Feature Request</option>
                  <option value="bug">Bug Report</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Priority *
                </label>
                <select
                  formControlName="priority"
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-neutral-900 dark:text-white mb-2">
                  Message *
                </label>
                <textarea
                  formControlName="message"
                  rows="5"
                  placeholder="Describe your issue in detail..."
                  class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                ></textarea>
              </div>

              <div class="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  (click)="closeTicketForm()"
                  class="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!ticketForm.valid"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [],
})
export class HelpCenterComponent implements OnInit {
  categories = signal<SupportCategory[]>([]);
  articles = signal<SupportArticle[]>([]);
  selectedCategory = signal<string | null>(null);
  selectedArticle = signal<SupportArticle | null>(null);
  showTicketForm = signal(false);
  searchQuery = signal('');
  searchResults = signal<SupportArticle[]>([]);
  ticketForm!: FormGroup;

  get categoryArticles(): () => SupportArticle[] {
    return () => {
      const categoryId = this.selectedCategory();
      if (!categoryId) return [];
      return this.articles().filter((a) => a.category === categoryId && a.isPublished);
    };
  }

  constructor(private logging: LoggingService, private fb: FormBuilder) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadMockData();
  }

  private initializeForm(): void {
    this.ticketForm = this.fb.group({
      subject: ['', Validators.required],
      category: ['general', Validators.required],
      priority: ['medium', Validators.required],
      message: ['', Validators.required],
    });
  }

  private loadMockData(): void {
    // Mock categories
    const categories: SupportCategory[] = [
      {
        id: 'cat_1',
        organizationId: 'org_1',
        name: 'Getting Started',
        slug: 'getting-started',
        description: 'Learn the basics',
        icon: '🚀',
        order: 1,
        isPublished: true,
        articleCount: 4,
      },
      {
        id: 'cat_2',
        organizationId: 'org_1',
        name: 'Billing & Plans',
        slug: 'billing',
        description: 'Manage your subscription',
        icon: '💳',
        order: 2,
        isPublished: true,
        articleCount: 3,
      },
      {
        id: 'cat_3',
        organizationId: 'org_1',
        name: 'API & Integration',
        slug: 'api',
        description: 'Technical documentation',
        icon: '⚙️',
        order: 3,
        isPublished: true,
        articleCount: 5,
      },
      {
        id: 'cat_4',
        organizationId: 'org_1',
        name: 'Troubleshooting',
        slug: 'troubleshooting',
        description: 'Fix common issues',
        icon: '🔧',
        order: 4,
        isPublished: true,
        articleCount: 3,
      },
    ];

    // Mock articles
    const articles: SupportArticle[] = [
      {
        id: 'art_1',
        organizationId: 'org_1',
        slug: 'getting-started-overview',
        title: 'Getting Started Overview',
        description: 'Learn the basics of our platform',
        content:
          'Welcome to our platform! This guide will help you get started. First, create an account. Then explore the dashboard to understand the main features available to you.',
        category: 'cat_1',
        tags: ['intro', 'onboarding'],
        order: 1,
        isPublished: true,
        views: 234,
        helpful: 45,
        unhelpful: 3,
        relatedArticles: ['art_2'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'support',
      },
      {
        id: 'art_2',
        organizationId: 'org_1',
        slug: 'creating-account',
        title: 'How to Create an Account',
        description: 'Step-by-step guide to sign up',
        content: 'Visit our homepage and click Sign Up. Enter your email, create a strong password, and verify your email address.',
        category: 'cat_1',
        tags: ['account', 'signup'],
        order: 2,
        isPublished: true,
        views: 567,
        helpful: 89,
        unhelpful: 4,
        relatedArticles: ['art_1'],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'support',
      },
      {
        id: 'art_3',
        organizationId: 'org_1',
        slug: 'understanding-plans',
        title: 'Understanding Our Plans',
        description: 'Compare pricing tiers',
        content:
          'We offer three plans: Starter (free), Pro ($49/month), and Enterprise ($299/month). Each tier includes different features and limits.',
        category: 'cat_2',
        tags: ['pricing', 'plans'],
        order: 1,
        isPublished: true,
        views: 890,
        helpful: 156,
        unhelpful: 12,
        relatedArticles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'support',
      },
      {
        id: 'art_4',
        organizationId: 'org_1',
        slug: 'api-authentication',
        title: 'API Authentication',
        description: 'Secure your API calls',
        content: 'All API requests require an API key in the Authorization header. Generate your key from the settings page.',
        category: 'cat_3',
        tags: ['api', 'authentication', 'security'],
        order: 1,
        isPublished: true,
        views: 445,
        helpful: 78,
        unhelpful: 5,
        relatedArticles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'support',
      },
      {
        id: 'art_5',
        organizationId: 'org_1',
        slug: 'troubleshoot-login',
        title: 'Troubleshooting Login Issues',
        description: 'Cannot sign in?',
        content:
          'If you cannot log in, try resetting your password. Click Forgot Password on the login page and follow the instructions.',
        category: 'cat_4',
        tags: ['troubleshooting', 'login'],
        order: 1,
        isPublished: true,
        views: 234,
        helpful: 123,
        unhelpful: 8,
        relatedArticles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'support',
      },
    ];

    this.categories.set(categories);
    this.articles.set(articles);
  }

  performSearch(): void {
    const query = this.searchQuery().toLowerCase();
    if (query === '') {
      this.searchResults.set([]);
    } else {
      const results = this.articles().filter(
        (a) =>
          (a.title.toLowerCase().includes(query) ||
            a.description.toLowerCase().includes(query) ||
            a.content.toLowerCase().includes(query)) &&
          a.isPublished
      );
      this.searchResults.set(results);
    }
  }

  getCategoryName(): string {
    const categoryId = this.selectedCategory();
    const category = this.categories().find((c) => c.id === categoryId);
    return category?.name || '';
  }

  getArticleById(articleId: string): SupportArticle | undefined {
    return this.articles().find((a) => a.id === articleId);
  }

  markHelpful(articleId: string, isHelpful: boolean): void {
    this.articles.update((articles) =>
      articles.map((a) =>
        a.id === articleId
          ? {
              ...a,
              helpful: isHelpful ? a.helpful + 1 : a.helpful,
              unhelpful: !isHelpful ? a.unhelpful + 1 : a.unhelpful,
            }
          : a
      )
    );

    this.selectedArticle.update((article) =>
      article
        ? {
            ...article,
            helpful: isHelpful ? article.helpful + 1 : article.helpful,
            unhelpful: !isHelpful ? article.unhelpful + 1 : article.unhelpful,
          }
        : null
    );

    this.logging.info('Article feedback recorded', 'APP', {
      articleId,
      helpful: isHelpful,
    });
  }

  openSubmitTicket(): void {
    this.ticketForm.reset({ priority: 'medium', category: 'general' });
    this.showTicketForm.set(true);
  }

  closeTicketForm(): void {
    this.showTicketForm.set(false);
    this.ticketForm.reset();
  }

  submitTicket(): void {
    if (!this.ticketForm.valid) return;

    const { subject, category, priority, message } = this.ticketForm.value;

    this.logging.info('Support ticket submitted', 'USER', {
      subject,
      category,
      priority,
      messageLength: message.length,
    });

    alert('Thank you for submitting your support ticket. We will get back to you soon!');
    this.closeTicketForm();
  }
}
