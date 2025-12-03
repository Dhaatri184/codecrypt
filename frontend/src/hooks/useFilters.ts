import { useState, useEffect, useCallback } from 'react';

export type HauntingType = 'ghost' | 'zombie' | 'vampire' | 'skeleton' | 'monster';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface IssueFilters {
  hauntingTypes: HauntingType[];
  severities: Severity[];
  filePaths: string[];
  searchTerm: string;
  showDismissed: boolean;
}

const DEFAULT_FILTERS: IssueFilters = {
  hauntingTypes: [],
  severities: [],
  filePaths: [],
  searchTerm: '',
  showDismissed: false,
};

const STORAGE_KEY = 'codecrypt_filters';

/**
 * Custom hook for managing issue filter state
 * Persists filters to session storage
 */
export function useFilters() {
  const [filters, setFilters] = useState<IssueFilters>(() => {
    // Load filters from session storage on mount
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load filters from session storage:', error);
    }
    return DEFAULT_FILTERS;
  });

  // Persist filters to session storage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.error('Failed to save filters to session storage:', error);
    }
  }, [filters]);

  const setHauntingTypes = useCallback((types: HauntingType[]) => {
    setFilters((prev) => ({ ...prev, hauntingTypes: types }));
  }, []);

  const setSeverities = useCallback((severities: Severity[]) => {
    setFilters((prev) => ({ ...prev, severities }));
  }, []);

  const setFilePaths = useCallback((paths: string[]) => {
    setFilters((prev) => ({ ...prev, filePaths: paths }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setFilters((prev) => ({ ...prev, searchTerm: term }));
  }, []);

  const setShowDismissed = useCallback((show: boolean) => {
    setFilters((prev) => ({ ...prev, showDismissed: show }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.hauntingTypes.length > 0 ||
      filters.severities.length > 0 ||
      filters.filePaths.length > 0 ||
      filters.searchTerm.length > 0 ||
      filters.showDismissed
    );
  }, [filters]);

  return {
    filters,
    setFilters,
    setHauntingTypes,
    setSeverities,
    setFilePaths,
    setSearchTerm,
    setShowDismissed,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}

