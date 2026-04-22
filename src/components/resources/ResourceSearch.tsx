import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResourceSuggestion {
  id: string;
  name: string;
  type: string;
  provider: string;
}

interface ResourceSearchProps {
  /** Current search value */
  value: string;
  /** Callback fired with debounced search term */
  onSearch: (query: string) => void;
  /** Suggestions to display in the dropdown */
  suggestions: ResourceSuggestion[];
  /** Callback when a suggestion is selected */
  onSuggestionSelect?: (suggestion: ResourceSuggestion) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'kt-recent-searches';

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  if (!query.trim()) return;
  const recent = getRecentSearches().filter((s) => s !== query);
  recent.unshift(query);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, 5)));
  } catch {
    // Ignore storage errors
  }
}

function clearRecentSearches() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ResourceSearch({
  value,
  onSearch,
  suggestions,
  onSuggestionSelect,
  placeholder = 'Search resources...',
  className,
}: ResourceSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    setIsOpen(true);

    // Debounced search (300ms)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 300);
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onSearch(localValue);
      saveRecentSearch(localValue);
      setRecentSearches(getRecentSearches());
      setIsOpen(false);
    }
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [localValue, onSearch]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearch('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onSearch]);

  const handleRecentClick = useCallback((query: string) => {
    setLocalValue(query);
    onSearch(query);
    setIsOpen(false);
  }, [onSearch]);

  const handleClearRecent = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: ResourceSuggestion) => {
    setLocalValue(suggestion.name);
    onSearch(suggestion.name);
    saveRecentSearch(suggestion.name);
    setRecentSearches(getRecentSearches());
    setIsOpen(false);
    onSuggestionSelect?.(suggestion);
  }, [onSearch, onSuggestionSelect]);

  const showSuggestions = isOpen && suggestions.length > 0;
  const showRecent = isOpen && !showSuggestions && localValue.length === 0 && recentSearches.length > 0;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="pl-8 pr-8"
        />
        {localValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
          <div className="max-h-64 overflow-auto">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                className="flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate font-medium">{suggestion.name}</span>
                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                  {suggestion.type}
                </span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                  {suggestion.provider}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent searches dropdown */}
      {showRecent && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
            <button
              type="button"
              onClick={handleClearRecent}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
          <div className="max-h-48 overflow-auto">
            {recentSearches.map((query) => (
              <button
                key={query}
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
                onClick={() => handleRecentClick(query)}
              >
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
