import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { VirtualScroller } from './VirtualScroller';
import { MediaCard } from './MediaCard';
import './MediaGrid.css';

export interface MediaItem {
  id: string;
  name: string;
  type: 'video' | 'image' | 'audio' | 'overlay';
  url: string;
  thumbnailUrl?: string;
  size: number;
  duration?: number;
  dimensions?: { width: number; height: number };
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  status: 'processing' | 'ready' | 'error';
  metadata?: Record<string, any>;
  views?: number;
  likes?: number;
}

interface MediaGridProps {
  items: MediaItem[];
  loading?: boolean;
  onItemClick?: (item: MediaItem) => void;
  onItemSelect?: (item: MediaItem, selected: boolean) => void;
  onEndReached?: () => void;
  selectedItems?: Set<string>;
  viewMode?: 'grid' | 'list' | 'masonry';
  columnCount?: number | 'auto';
  gap?: number;
  showStats?: boolean;
  showActions?: boolean;
  className?: string;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  loading = false,
  onItemClick,
  onItemSelect,
  onEndReached,
  selectedItems = new Set(),
  viewMode = 'grid',
  columnCount = 'auto',
  gap = 20,
  showStats = true,
  showActions = true,
  className = ''
}) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [columns, setColumns] = useState(3);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Calculate responsive columns + container size
  useEffect(() => {
    const calculateColumns = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;

      if (columnCount === 'auto') {
        if (width < 480) setColumns(1);
        else if (width < 768) setColumns(2);
        else if (width < 1024) setColumns(3);
        else if (width < 1440) setColumns(4);
        else setColumns(5);
      } else {
        setColumns(columnCount as number);
      }

      setDimensions({
        width,
        height: containerRef.current.offsetHeight || Math.min(window.innerHeight - 300, 800) || 600
      });
    };

    calculateColumns();
    resizeObserverRef.current = new ResizeObserver(calculateColumns);
    if (containerRef.current) resizeObserverRef.current.observe(containerRef.current);
    window.addEventListener('resize', calculateColumns, { passive: true });

    return () => {
      resizeObserverRef.current?.disconnect();
      window.removeEventListener('resize', calculateColumns);
    };
  }, [columnCount]);

  // Handle item selection
  const handleItemSelect = useCallback((item: MediaItem, event: React.MouseEvent) => {
    event.stopPropagation();
    if (onItemSelect) {
      onItemSelect(item, !selectedItems.has(item.id));
    }
  }, [selectedItems, onItemSelect]);

  // Handle item click
  const handleItemClick = useCallback((item: MediaItem) => {
    onItemClick?.(item);
  }, [onItemClick]);

  // Preload images for smooth scrolling
  const preloadImage = useCallback((url: string) => {
    if (!url) return;
    if (!loadedImages.has(url)) {
      const img = new Image();
      img.onload = () => {
        setLoadedImages(prev => {
          const next = new Set(prev);
          next.add(url);
          return next;
        });
      };
      img.src = url;
    }
  }, [loadedImages]);

  // Calculate item dimensions based on view mode
  const getItemDimensions = useCallback(() => {
    const containerWidth = dimensions.width || 1200;
    const itemWidth = (containerWidth - (gap * (columns - 1))) / Math.max(columns, 1);

    switch (viewMode) {
      case 'grid':
        return { width: itemWidth, height: itemWidth * 0.75 }; // 4:3
      case 'list':
        return { width: containerWidth, height: 120 };
      case 'masonry':
        return { width: itemWidth, height: 'auto' as const };
      default:
        return { width: itemWidth, height: itemWidth };
    }
  }, [dimensions.width, columns, gap, viewMode]);

  // Render individual item
  const renderItem = useCallback((item: MediaItem, index: number) => {
    const itemDimensions = getItemDimensions();
    const isSelected = selectedItems.has(item.id);
    const isHovered = hoveredItem === item.id;

    if (item.thumbnailUrl) preloadImage(item.thumbnailUrl);

    return (
      <div
        key={item.id}
        className={`grid-item ${viewMode} ${isHovered ? 'hovered' : ''}`}
        style={{
          width: itemDimensions.width,
          height: itemDimensions.height === 'auto' ? undefined : (itemDimensions.height as number),
          animationDelay: `${index * 0.02}s`
        }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <MediaCard
          item={item}
          selected={isSelected}
          onSelect={(e) => handleItemSelect(item, e)}
          onClick={() => handleItemClick(item)}
          showStats={showStats}
          showActions={showActions}
          viewMode={viewMode}
          loaded={loadedImages.has(item.thumbnailUrl || '')}
        />
      </div>
    );
  }, [
    selectedItems,
    hoveredItem,
    viewMode,
    showStats,
    showActions,
    loadedImages,
    getItemDimensions,
    handleItemSelect,
    handleItemClick,
    preloadImage
  ]);

  // Group items for masonry layout
  const masonryColumns = useMemo(() => {
    if (viewMode !== 'masonry') return [items];
    const cols = Math.max(columns, 1);
    const columnArrays: MediaItem[][] = Array(cols).fill(null).map(() => []);
    const columnHeights = Array(cols).fill(0);

    items.forEach(item => {
      const shortest = columnHeights.indexOf(Math.min(...columnHeights));
      columnArrays[shortest].push(item);
      const estimatedHeight = item.type === 'video' ? 300 : item.type === 'image' ? 250 : 200;
      columnHeights[shortest] += estimatedHeight;
    });

    return columnArrays;
  }, [items, columns, viewMode]);

  // Render grid based on view mode
  const renderGrid = () => {
    if (viewMode === 'masonry') {
      return (
        <div className="masonry-container" style={{ gap }}>
          {masonryColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="masonry-column" style={{ gap }}>
              {column.map((item, index) => renderItem(item, index))}
            </div>
          ))}
        </div>
      );
    }

    // Virtualized for grid & list
    const itemDims = getItemDimensions();
    const itemHeight = viewMode === 'list' ? 120 : (itemDims.height as number);

    return (
      <VirtualScroller
        items={items}
        renderItem={renderItem}
        itemHeight={itemHeight}
        containerHeight={dimensions.height || 600}
        onEndReached={onEndReached}
        buffer={2}
        className="grid-scroller"
      />
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <div className="grid-empty">
      <div className="empty-icon">ðŸ“</div>
      <h3>Keine Medien gefunden</h3>
      <p>Lade deine ersten Dateien hoch oder Ã¤ndere deine Filter</p>
    </div>
  );

  // Skeletons
  const renderSkeleton = () => {
    const count = Math.max(columns, 1) * 3;
    const dims = getItemDimensions();
    return (
      <div className={`grid-skeleton ${viewMode}`} style={{ gap }}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="skeleton-item"
            style={{
              width: dims.width,
              height: dims.height === 'auto' ? 200 : (dims.height as number),
              animationDelay: `${index * 0.05}s`
            }}
          >
            <div className="skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`media-grid ${className} ${viewMode}-view`}
      role="region"
      aria-busy={loading}
      aria-live="polite"
    >
      {loading && items.length === 0 ? (
        renderSkeleton()
      ) : items.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <div className="grid-container" style={{ gap }}>
            {renderGrid()}
          </div>

          {loading && (
            <div className="grid-loading">
              <div className="loading-spinner" />
              <span>Lade weitere Medien...</span>
            </div>
          )}
        </>
      )}

      {/* Hover Effects Container */}
      <div className="grid-effects" aria-hidden="true">
        <div className="grid-glow" />
      </div>
    </div>
  );
};

