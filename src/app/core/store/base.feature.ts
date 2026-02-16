import { signal } from '@angular/core';

/**
 * Base feature state that all domain stores should extend or compose.
 * Provides common fields and methods for loading, error, and initialization states.
 */
export interface BaseFeatureState {
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export function createBaseFeature() {
  return {
    loading: signal(false),
    error: signal<string | null>(null),
    initialized: signal(false),

    // Methods
    setLoading(value: boolean) {
      this.loading.set(value);
    },

    setError(error: string | null) {
      this.error.set(error);
    },

    clearError() {
      this.error.set(null);
    },

    setInitialized(value: boolean) {
      this.initialized.set(value);
    },
  };
}
