import { Injectable } from '@angular/core';
import { signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { LoggingService } from './logging.service';

/**
 * Advanced Search & Filtering Service
 * Provides global search, filtering, sorting, and faceting capabilities
 * across the entire application
 */

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: any;
  caseSensitive?: boolean;
}

export interface SearchOptions {
  query?: string;
  filters?: SearchFilter[];
  sort?: { field: string; order: 'asc' | 'desc' }[];
  facets?: string[]; // Fields to facet on
  limit?: number;
  offset?: number;
}

export interface SearchResult<T = any> {
  id: string;
  type: string; // 'user', 'team', 'invoice', etc.
  title: string;
  description?: string;
  data: T;
  score: number; // Relevance score
  matches?: {
    field: string;
    value: string;
    positions: number[];
  }[];
}

export interface FacetValue {
  value: any;
  count: number;
  label?: string;
}

export interface SearchResponse<T = any> {
  results: SearchResult<T>[];
  total: number;
  took: number; // milliseconds
  facets?: Record<string, FacetValue[]>;
}

export interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  options: SearchOptions;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AdvancedSearchService {
  private mockData: Record<string, any[]> = {
    users: [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'member', status: 'active' },
      { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'viewer', status: 'inactive' },
    ],
    teams: [
      { id: 'team_1', name: 'Engineering', memberCount: 12, status: 'active' },
      { id: 'team_2', name: 'Sales', memberCount: 8, status: 'active' },
      { id: 'team_3', name: 'Support', memberCount: 5, status: 'archived' },
    ],
    invoices: [
      {
        id: 'inv_1',
        number: 'INV-001',
        amount: 9900,
        status: 'paid',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'inv_2',
        number: 'INV-002',
        amount: 14900,
        status: 'pending',
        date: new Date(),
      },
    ],
  };

  private savedSearches = new Map<string, SavedSearch>();
  recentSearches = signal<SearchOptions[]>([]);
  savedSearchesList = signal<SavedSearch[]>([]);

  constructor(private logging: LoggingService) {
    this.initializeMockData();
  }

  /**
   * Global search across all data types
   */
  search<T = any>(options: SearchOptions): Observable<SearchResponse<T>> {
    const startTime = performance.now();

    // Flatten all data
    const allData: SearchResult[] = [];
    Object.entries(this.mockData).forEach(([type, items]) => {
      (items as any[]).forEach((item, index) => {
        const result = this.createSearchResult(item, type, options.query);
        allData.push(result);
      });
    });

    // Filter
    let results = allData;
    if (options.filters) {
      results = results.filter((r) => this.matchesFilters(r.data, options.filters || []));
    }

    // Search query
    if (options.query) {
      results = results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
    }

    // Sort
    if (options.sort) {
      options.sort.forEach(({ field, order }) => {
        results.sort((a, b) => {
          const aVal = this.getNestedValue(a.data, field);
          const bVal = this.getNestedValue(b.data, field);
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return order === 'asc' ? comparison : -comparison;
        });
      });
    }

    // Facets
    let facets: Record<string, FacetValue[]> | undefined;
    if (options.facets) {
      facets = {};
      options.facets.forEach((field) => {
        const counts = new Map<string, number>();
        results.forEach((r) => {
          const val = String(this.getNestedValue(r.data, field));
          counts.set(val, (counts.get(val) || 0) + 1);
        });
        facets![field] = Array.from(counts.entries()).map(([value, count]) => ({
          value,
          count,
          label: value,
        }));
      });
    }

    // Pagination
    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paginatedResults = results.slice(offset, offset + limit);

    const took = performance.now() - startTime;

    // Store in recent searches
    if (options.query) {
      this.addRecentSearch(options);
    }

    return of<SearchResponse<T>>({
      results: paginatedResults as SearchResult<T>[],
      total,
      took: Math.round(took),
      facets,
    }).pipe(delay(200));
  }

  /**
   * Search specific type
   */
  searchByType<T = any>(type: string, options: SearchOptions): Observable<SearchResponse<T>> {
    const data = this.mockData[type] || [];
    let results = data.map((item) => this.createSearchResult(item, type, options.query));

    // Filter
    if (options.filters) {
      results = results.filter((r) => this.matchesFilters(r.data, options.filters || []));
    }

    // Search
    if (options.query) {
      results = results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
    }

    // Sort
    if (options.sort) {
      options.sort.forEach(({ field, order }) => {
        results.sort((a, b) => {
          const aVal = this.getNestedValue(a.data, field);
          const bVal = this.getNestedValue(b.data, field);
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return order === 'asc' ? comparison : -comparison;
        });
      });
    }

    // Pagination
    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;
    const paginatedResults = results.slice(offset, offset + limit);

    return of<SearchResponse<T>>({
      results: paginatedResults as SearchResult<T>[],
      total,
      took: 0,
    }).pipe(delay(150));
  }

  /**
   * Save search for later use
   */
  saveSearch(name: string, options: SearchOptions, description?: string): Observable<SavedSearch> {
    const saved: SavedSearch = {
      id: `search_${Date.now()}`,
      name,
      description,
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.savedSearches.set(saved.id, saved);
    this.savedSearchesList.update((searches) => [...searches, saved]);

    this.logging.info('Search saved', 'USER', { searchId: saved.id, name });

    return of(saved).pipe(delay(200));
  }

  /**
   * Get saved searches
   */
  getSavedSearches(): Observable<SavedSearch[]> {
    return of(Array.from(this.savedSearches.values())).pipe(delay(150));
  }

  /**
   * Get saved search by ID
   */
  getSavedSearch(searchId: string): Observable<SavedSearch | null> {
    return of(this.savedSearches.get(searchId) || null).pipe(delay(150));
  }

  /**
   * Delete saved search
   */
  deleteSavedSearch(searchId: string): Observable<void> {
    this.savedSearches.delete(searchId);
    this.savedSearchesList.update((searches) => searches.filter((s) => s.id !== searchId));

    this.logging.info('Saved search deleted', 'USER', { searchId });

    return of(void 0).pipe(delay(200));
  }

  /**
   * Add to recent searches
   */
  private addRecentSearch(options: SearchOptions): void {
    this.recentSearches.update((searches) => {
      const filtered = searches.filter((s) => JSON.stringify(s) !== JSON.stringify(options));
      return [options, ...filtered].slice(0, 10);
    });
  }

  /**
   * Get autocomplete suggestions
   */
  getAutocompleteSuggestions(query: string, type?: string): Observable<Array<{ label: string; value: string }>> {
    const suggestions: Array<{ label: string; value: string }> = [];

    if (!query) {
      return of(suggestions).pipe(delay(100));
    }

    const lowQuery = query.toLowerCase();
    const dataToSearch = type ? this.mockData[type] || [] : Object.values(this.mockData).flat();

    const seen = new Set<string>();

    (dataToSearch as any[]).forEach((item) => {
      ['name', 'title', 'email', 'description'].forEach((field) => {
        const val = item[field];
        if (val && typeof val === 'string' && val.toLowerCase().includes(lowQuery)) {
          if (!seen.has(val)) {
            suggestions.push({ label: val, value: val });
            seen.add(val);
          }
        }
      });
    });

    return of(suggestions.slice(0, 10)).pipe(delay(150));
  }

  /**
   * Get search suggestions based on recent activity
   */
  getSearchSuggestions(): Observable<string[]> {
    const suggestions = new Set<string>();

    this.recentSearches().forEach((search) => {
      if (search.query) {
        suggestions.add(search.query);
      }
    });

    return of(Array.from(suggestions)).pipe(delay(100));
  }

  /**
   * Get available filters for a type
   */
  getAvailableFilters(type: string): Observable<Array<{ field: string; values: any[] }>> {
    const data = this.mockData[type] || [];
    const filters: Array<{ field: string; values: any[] }> = [];

    if (data.length === 0) {
      return of(filters).pipe(delay(150));
    }

    const firstItem = data[0];
    Object.keys(firstItem).forEach((field) => {
      if (!['id', 'createdAt', 'updatedAt'].includes(field)) {
        const values = Array.from(new Set(data.map((item: any) => item[field])));
        filters.push({ field, values });
      }
    });

    return of(filters).pipe(delay(150));
  }

  /**
   * Create search result from data
   */
  private createSearchResult(item: any, type: string, query?: string): SearchResult {
    const searchable = [item.name || '', item.title || '', item.email || '', item.description || ''].join(' ');
    let score = 1;

    if (query) {
      const lowQuery = query.toLowerCase();
      const lowSearchable = searchable.toLowerCase();
      if (lowSearchable.includes(lowQuery)) {
        score = lowQuery.length / lowSearchable.length;
        // Boost if starts with query
        if (lowSearchable.startsWith(lowQuery)) {
          score += 0.5;
        }
      } else {
        score = 0;
      }
    }

    return {
      id: item.id,
      type,
      title: item.name || item.title || item.number || 'Untitled',
      description: item.description || item.email || '',
      data: item,
      score,
    };
  }

  /**
   * Check if item matches filters
   */
  private matchesFilters(item: any, filters: SearchFilter[]): boolean {
    return filters.every((filter) => {
      const value = this.getNestedValue(item, filter.field);
      return this.matchesFilter(value, filter);
    });
  }

  /**
   * Check if value matches a single filter
   */
  private matchesFilter(value: any, filter: SearchFilter): boolean {
    const { operator, value: filterValue, caseSensitive = false } = filter;

    const normalize = (v: any) => {
      if (typeof v === 'string' && !caseSensitive) {
        return v.toLowerCase();
      }
      return v;
    };

    const normalizedValue = normalize(value);
    const normalizedFilter = normalize(filterValue);

    switch (operator) {
      case 'equals':
        return normalizedValue === normalizedFilter;
      case 'contains':
        return String(normalizedValue).includes(String(normalizedFilter));
      case 'startsWith':
        return String(normalizedValue).startsWith(String(normalizedFilter));
      case 'endsWith':
        return String(normalizedValue).endsWith(String(normalizedFilter));
      case 'gt':
        return value > filterValue;
      case 'gte':
        return value >= filterValue;
      case 'lt':
        return value < filterValue;
      case 'lte':
        return value <= filterValue;
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);
      case 'between':
        return Array.isArray(filterValue) && value >= filterValue[0] && value <= filterValue[1];
      default:
        return true;
    }
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Initialize mock data
   */
  private initializeMockData(): void {
    // Data already initialized in constructor
  }

  /**
   * Export search results
   */
  exportResults(results: SearchResult[], format: 'csv' | 'json' = 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    }

    // CSV format
    const headers = ['ID', 'Type', 'Title', 'Score'];
    const rows = results.map((r) => [r.id, r.type, r.title, r.score]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    return csv;
  }
}
