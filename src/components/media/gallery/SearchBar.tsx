import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SearchBar.css';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'tag' | 'file';
  icon?: string;
  count?: number;
}

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  popularSearches?: string[];
  placeholder?: string;
  autoFocus?: boolean;
  showAdvanced?: boolean;
  onAdvancedSearch?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChange,
  onSearch,
  suggestions = [],
  recentSearches = [],
  popularSearches = [],
  placeholder = 'Suche nach Videos, Clips, Screenshots...',
  autoFocus = false,
  showAdvanced = true,
  onAdvancedSearch,
  className = ''
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(recentSearches);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<number>();

  // Sync with external value
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Close suggestions on outside click (extra safety beyond blur delay)
  useEffect(() => {
    const onDocPointerDown = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };
    if (showSuggestions) {
      document.addEventListener('mousedown', onDocPointerDown);
    }
    return () => document.removeEventListener('mousedown', onDocPointerDown);
  }, [showSuggestions]);

  // Generate suggestions based on input
  const generateSuggestions = useCallback((): SearchSuggestion[] => {
    const allSuggestions: SearchSuggestion[] = [];
    
    if (internalValue.trim() === '') {
      // Show recent and popular searches when input is empty
      searchHistory.slice(0, 3).forEach(search => {
        allSuggestions.push({
          id: `recent-${search}`,
          text: search,
          type: 'recent',
          icon: '??'
        });
      });
      
      popularSearches.slice(0, 3).forEach(search => {
        allSuggestions.push({
          id: `popular-${search}`,
          text: search,
          type: 'popular',
          icon: '??'
        });
      });
    } else {
      // Filter suggestions based on input
      const filtered = suggestions.filter(s => 
        s.text.toLowerCase().includes(internalValue.toLowerCase())
      );
      allSuggestions.push(...filtered);
    }
    
    return allSuggestions;
  }, [internalValue, suggestions, searchHistory, popularSearches]);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    setSelectedSuggestionIndex(-1);
    setShowSuggestions(true);
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set new timer for debounced onChange
    debounceTimer.current = window.setTimeout(() => {
      onChange(newValue);
      if (newValue.trim().length > 2) {
        setIsSearching(true);
        // Simulate search delay
        window.setTimeout(() => setIsSearching(false), 500);
      }
    }, 300);
  };

  // Handle search submission
  const handleSearch = (searchValue?: string) => {
    const finalValue = searchValue || internalValue;
    
    if (finalValue.trim()) {
      // Add to search history
      setSearchHistory(prev => {
        const updated = [finalValue, ...prev.filter(s => s !== finalValue)];
        return updated.slice(0, 10); // Keep last 10 searches
      });
      
      if (onSearch) {
        onSearch(finalValue);
      }
      
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestionsList = generateSuggestions();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestionsList.length - 1 ? prev + 1 : prev
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < suggestionsList.length) {
          handleSuggestionClick(suggestionsList[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
        
      case 'Escape':
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInternalValue(suggestion.text);
    onChange(suggestion.text);
    handleSearch(suggestion.text);
    setShowSuggestions(false);
  };

  // Handle clear
  const handleClear = () => {
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
    setShowSuggestions(false);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  // Handle blur
  const handleBlur = () => {
    // Delay to allow suggestion clicks
    window.setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
    }, 200);
  };

  // Remove from history
  const removeFromHistory = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchHistory(prev => prev.filter(s => s !== search));
  };

  // Get icon for suggestion type
  const getTypeIcon = (type: SearchSuggestion['type']): string => {
    switch (type) {
      case 'recent': return '??';
      case 'popular': return '??';
      case 'tag': return '???';
      case 'file': return '??';
      default: return '??';
    }
  };

  const suggestionsList = generateSuggestions();

  return (
    <div className={`search-bar ${className} ${isFocused ? 'focused' : ''}`}>
      <div className="search-container">
        {/* Search Icon */}
        <div className="search-icon">
          {isSearching ? (
            <div className="search-spinner" />
          ) : (
            <span>??</span>
          )}
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          value={internalValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          aria-label="Suchfeld"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
          aria-activedescendant={
            selectedSuggestionIndex >= 0 
              ? `suggestion-${selectedSuggestionIndex}` 
              : undefined
          }
        />

        {/* Clear Button */}
        {internalValue && (
          <button
            className="search-clear"
            onClick={handleClear}
            aria-label="Suche l�schen"
            type="button"
          >
            ??
          </button>
        )}

        {/* Search Button */}
        <button
          className="search-button"
          onClick={() => handleSearch()}
          aria-label="Suchen"
          type="button"
        >
          <span>Suchen</span>
        </button>

        {/* Advanced Search */}
        {showAdvanced && onAdvancedSearch && (
          <button
            className="search-advanced"
            onClick={onAdvancedSearch}
            aria-label="Erweiterte Suche"
            type="button"
          >
            <span>??</span>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestionsList.length > 0 || internalValue === '') && (
        <div
          ref={suggestionsRef}
          id="search-suggestions"
          className="search-suggestions"
          role="listbox"
        >
          {internalValue === '' && (
            <>
              {/* Recent Searches */}
              {searchHistory.length > 0 && (
                <div className="suggestions-section">
                  <h4 className="section-title">Zuletzt gesucht</h4>
                  {searchHistory.slice(0, 5).map((search, index) => (
                    <div
                      key={`recent-${index}`}
                      className={`suggestion-item ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                      onClick={() => handleSuggestionClick({
                        id: `recent-${search}`,
                        text: search,
                        type: 'recent'
                      })}
                      role="option"
                      aria-selected={selectedSuggestionIndex === index}
                    >
                      <span className="suggestion-icon">??</span>
                      <span className="suggestion-text">{search}</span>
                      <button
                        className="suggestion-remove"
                        onClick={(e) => removeFromHistory(search, e)}
                        aria-label={`${search} aus Verlauf entfernen`}
                        type="button"
                      >
                        �
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <div className="suggestions-section">
                  <h4 className="section-title">Beliebte Suchen</h4>
                  {popularSearches.slice(0, 5).map((search, index) => {
                    const actualIndex = searchHistory.length + index;
                    return (
                      <div
                        key={`popular-${index}`}
                        className={`suggestion-item ${selectedSuggestionIndex === actualIndex ? 'selected' : ''}`}
                        onClick={() => handleSuggestionClick({
                          id: `popular-${search}`,
                          text: search,
                          type: 'popular'
                        })}
                        role="option"
                        aria-selected={selectedSuggestionIndex === actualIndex}
                      >
                        <span className="suggestion-icon">??</span>
                        <span className="suggestion-text">{search}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Search Suggestions */}
          {internalValue !== '' && suggestionsList.length > 0 && (
            <div className="suggestions-section">
              {suggestionsList.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  id={`suggestion-${index}`}
                  className={`suggestion-item ${selectedSuggestionIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  role="option"
                  aria-selected={selectedSuggestionIndex === index}
                >
                  <span className="suggestion-icon">
                    {suggestion.icon || getTypeIcon(suggestion.type)}
                  </span>
                  <span className="suggestion-text">
                    {highlightMatch(suggestion.text, internalValue)}
                  </span>
                  {suggestion.count !== undefined && (
                    <span className="suggestion-count">{suggestion.count}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {internalValue !== '' && suggestionsList.length === 0 && (
            <div className="suggestions-empty">
              <span className="empty-icon">??</span>
              <p>Keine Ergebnisse f�r "{internalValue}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Highlight matching text with regex-escape for the query
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const safe = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${safe})`, 'gi'));
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="highlight">{part}</mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
    </>
  );
}
