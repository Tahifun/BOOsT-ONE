import React, { useState, useEffect, useRef } from 'react';
import './FilterBar.css';

export interface FilterOptions {
  type?: string[];
  status?: string[];
  dateRange?: { start: Date; end: Date };
  tags?: string[];
  sizeRange?: { min: number; max: number };
  searchQuery?: string;
}

export interface SortOptions {
  field: 'name' | 'date' | 'size' | 'type' | 'views' | 'duration';
  direction: 'asc' | 'desc';
}

interface FilterBarProps {
  filters: FilterOptions;
  sort: SortOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onSortChange: (sort: SortOptions) => void;
  availableTags?: string[];
  totalItems?: number;
  filteredItems?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  availableTags = [],
  totalItems = 0,
  filteredItems = 0,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<number>(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);
  const [minSizeMB, setMinSizeMB] = useState<number | ''>(filters.sizeRange ? Math.round((filters.sizeRange.min || 0) / (1024*1024)) : '');
  const [maxSizeMB, setMaxSizeMB] = useState<number | ''>(filters.sizeRange ? Math.round((filters.sizeRange.max || 0) / (1024*1024)) : '');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const filterBarRef = useRef<HTMLDivElement>(null);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (filters.type && filters.type.length > 0) count++;
    if (filters.status && filters.status.length > 0) count++;
    if (filters.dateRange) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    if (filters.sizeRange) count++;
    if (filters.searchQuery && filters.searchQuery.trim() !== '') count++;
    setActiveFilters(count);
  }, [filters]);

  // Media types
  const mediaTypes = [
    { value: 'video', label: 'Videos', icon: '??' },
    { value: 'image', label: 'Bilder', icon: '???' },
    { value: 'audio', label: 'Audio', icon: '??' },
    { value: 'overlay', label: 'Overlays', icon: '??' }
  ];

  // Status options
  const statusOptions = [
    { value: 'ready', label: 'Bereit', color: 'success' },
    { value: 'processing', label: 'Verarbeitung', color: 'warning' },
    { value: 'error', label: 'Fehler', color: 'error' }
  ];

  const sortFields = [
    { value: 'name', label: 'Name' },
    { value: 'date', label: 'Datum' },
    { value: 'size', label: 'Gr��e' },
    { value: 'type', label: 'Typ' },
    { value: 'views', label: 'Aufrufe' },
    { value: 'duration', label: 'Dauer' }
  ];

  // Type filter
  const handleTypeFilter = (type: string) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type) ? currentTypes.filter(t => t !== type) : [...currentTypes, type];
    onFiltersChange({ ...filters, type: newTypes.length > 0 ? newTypes : undefined });
  };

  // Status filter
  const handleStatusFilter = (status: string) => {
    const currentStatus = filters.status || [];
    const newStatus = currentStatus.includes(status) ? currentStatus.filter(s => s !== status) : [...currentStatus, status];
    onFiltersChange({ ...filters, status: newStatus.length > 0 ? newStatus : undefined });
  };

  // Tag selection
  const handleTagToggle = (tag: string) => {
    const currentTags = tempFilters.tags || [];
    const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
    setTempFilters({ ...tempFilters, tags: newTags });
  };

  const applyTagFilters = () => {
    onFiltersChange({ ...filters, tags: tempFilters.tags && tempFilters.tags.length > 0 ? tempFilters.tags : undefined });
    setShowTagSelector(false);
  };

  // Date range
  const handleDateRange = (range: 'today' | 'week' | 'month' | 'year' | 'custom') => {
    const now = new Date();
    let start: Date;
    switch (range) {
      case 'today': start = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case 'week': start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case 'month': start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
      case 'year': start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
      default:
        setShowDatePicker(true);
        return;
    }
    onFiltersChange({ ...filters, dateRange: { start, end: new Date() } });
  };

  // Clear all
  const clearAllFilters = () => {
    onFiltersChange({});
    setTempFilters({});
    setMinSizeMB(''); setMaxSizeMB('');
    setCustomStart(''); setCustomEnd('');
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div ref={filterBarRef} className={`filter-bar ${className} ${isExpanded ? 'expanded' : ''}`}>
      {/* Main Row */}
      <div className="filter-main">
        {/* Search */}
        <div className="filter-search">
          <input
            type="text"
            className="search-input"
            placeholder="Suchen..."
            defaultValue={filters.searchQuery || ''}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value || undefined })}
            aria-label="Suche"
          />
        </div>

        {/* Quick Filters */}
        <div className="filter-quick">
          <div className="filter-group">
            <span className="filter-label">Typ:</span>
            <div className="filter-chips">
              {mediaTypes.map(type => (
                <button
                  key={type.value}
                  className={`filter-chip ${filters.type?.includes(type.value) ? 'active' : ''}`}
                  onClick={() => handleTypeFilter(type.value)}
                  aria-label={`${type.label} filtern`}
                >
                  <span className="chip-icon">{type.icon}</span>
                  <span className="chip-label">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Status:</span>
            <div className="filter-chips">
              {statusOptions.map(status => (
                <button
                  key={status.value}
                  className={`filter-chip status-${status.color} ${filters.status?.includes(status.value) ? 'active' : ''}`}
                  onClick={() => handleStatusFilter(status.value)}
                  aria-label={`Status ${status.label}`}
                >
                  <span className="chip-label">{status.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort */}
        <div className="filter-sort">
          <label className="sort-label">
            Sortieren:
            <select
              className="sort-select"
              value={sort.field}
              onChange={(e) => onSortChange({ ...sort, field: e.target.value as SortOptions['field'] })}
            >
              {sortFields.map(field => (
                <option key={field.value} value={field.value}>{field.label}</option>
              ))}
            </select>
          </label>
          <button
            className={`sort-direction ${sort.direction}`}
            onClick={() => onSortChange({ ...sort, direction: sort.direction === 'asc' ? 'desc' : 'asc' })}
            aria-label={`Sortierung ${sort.direction === 'asc' ? 'absteigend' : 'aufsteigend'}`}
          >
            {sort.direction === 'asc' ? '?' : '?'}
          </button>
        </div>

        {/* Actions */}
        <div className="filter-actions">
          {activeFilters > 0 && <span className="active-filters-badge">{activeFilters} aktiv</span>}
          <button className="filter-toggle" onClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded} aria-label="Erweiterte Filter">
            <span className="toggle-icon">??</span>
            <span className="toggle-label">Filter</span>
            <span className="toggle-arrow">{isExpanded ? '?' : '?'}</span>
          </button>
          {activeFilters > 0 && (
            <button className="filter-clear" onClick={clearAllFilters} aria-label="Alle Filter zur�cksetzen">?? Zur�cksetzen</button>
          )}
        </div>
      </div>

      {/* Expanded */}
      {isExpanded && (
        <div className="filter-expanded">
          {/* Date Range */}
          <div className="filter-section">
            <h4 className="section-title">Zeitraum</h4>
            <div className="date-options">
              <button className={`date-option ${filters.dateRange ? '' : 'active'}`} onClick={() => onFiltersChange({ ...filters, dateRange: undefined })}>Alle</button>
              <button className="date-option" onClick={() => handleDateRange('today')}>Heute</button>
              <button className="date-option" onClick={() => handleDateRange('week')}>7 Tage</button>
              <button className="date-option" onClick={() => handleDateRange('month')}>30 Tage</button>
              <button className="date-option" onClick={() => handleDateRange('year')}>1 Jahr</button>
              <button className="date-option custom" onClick={() => handleDateRange('custom')}>Benutzerdefiniert</button>
            </div>
            {filters.dateRange && (
              <div className="date-display">?? {formatDate(filters.dateRange.start)} - {formatDate(filters.dateRange.end)}</div>
            )}
            {showDatePicker && (
              <div className="date-picker">
                <input type="date" className="date-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                <span className="range-separator">-</span>
                <input type="date" className="date-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                <button
                  className="btn-apply"
                  onClick={() => {
                    if (customStart && customEnd) {
                      onFiltersChange({ ...filters, dateRange: { start: new Date(customStart), end: new Date(customEnd) } });
                      setShowDatePicker(false);
                    }
                  }}
                >
                  Anwenden
                </button>
                <button className="btn-cancel" onClick={() => setShowDatePicker(false)}>Abbrechen</button>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="filter-section">
            <h4 className="section-title">
              Tags {filters.tags && filters.tags.length > 0 && <span className="section-count">({filters.tags.length})</span>}
            </h4>
            <button className="tag-selector-toggle" onClick={() => setShowTagSelector(!showTagSelector)}>??? Tags ausw�hlen</button>
            {showTagSelector && (
              <div className="tag-selector">
                <div className="tag-list">
                  {availableTags.map(tag => (
                    <label key={tag} className="tag-option">
                      <input type="checkbox" checked={tempFilters.tags?.includes(tag) || false} onChange={() => handleTagToggle(tag)} />
                      <span className="tag-name">{tag}</span>
                    </label>
                  ))}
                </div>
                <div className="tag-actions">
                  <button className="btn-apply" onClick={applyTagFilters}>Anwenden</button>
                  <button className="btn-cancel" onClick={() => { setShowTagSelector(false); setTempFilters({ ...tempFilters, tags: filters.tags }); }}>Abbrechen</button>
                </div>
              </div>
            )}
            {filters.tags && filters.tags.length > 0 && (
              <div className="selected-tags">
                {filters.tags.map(tag => (
                  <span key={tag} className="tag-chip">
                    {tag}
                    <button
                      className="tag-remove"
                      onClick={() => {
                        const newTags = filters.tags!.filter(t => t !== tag);
                        onFiltersChange({ ...filters, tags: newTags.length > 0 ? newTags : undefined });
                      }}
                    >
                      �
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Size Range */}
          <div className="filter-section">
            <h4 className="section-title">Dateigr��e</h4>
            <div className="size-range">
              <input
                type="number"
                className="size-input"
                placeholder="Min MB"
                value={minSizeMB}
                onChange={(e) => {
                  const v = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                  setMinSizeMB(v);
                  const min = v === '' ? 0 : (v as number) * 1024 * 1024;
                  onFiltersChange({ ...filters, sizeRange: { min, max: filters.sizeRange?.max || Number.MAX_SAFE_INTEGER } });
                }}
              />
              <span className="range-separator">-</span>
              <input
                type="number"
                className="size-input"
                placeholder="Max MB"
                value={maxSizeMB}
                onChange={(e) => {
                  const v = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0);
                  setMaxSizeMB(v);
                  const max = v === '' ? Number.MAX_SAFE_INTEGER : (v as number) * 1024 * 1024;
                  onFiltersChange({ ...filters, sizeRange: { min: filters.sizeRange?.min || 0, max } });
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      {totalItems > 0 && (
        <div className="filter-info">
          <span className="info-text">
            {filteredItems === totalItems ? `${totalItems} Medien` : `${filteredItems} von ${totalItems} Medien`}
          </span>
        </div>
      )}
    </div>
  );
};
