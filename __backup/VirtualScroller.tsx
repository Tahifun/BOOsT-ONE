import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import './VirtualScroller.css';

interface VirtualScrollerProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number | ((item: T, index: number) => number);
  containerHeight: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  buffer?: number;
  className?: string;
  overscan?: number;
  scrollRestoration?: boolean;
}

export function VirtualScroller<T extends { id: string }>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  onEndReached,
  endReachedThreshold = 100,
  buffer = 3,
  className = '',
  overscan = 2,
  scrollRestoration = true
}: VirtualScrollerProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<number>();
  const lastScrollPosition = useRef<number>(0);
  const itemHeightsCache = useRef<Map<string, number>>(new Map());
  const lastEndCall = useRef<{ len: number; ts: number }>({ len: 0, ts: 0 });

  // Calculate item heights
  const getItemHeight = useCallback((item: T, index: number): number => {
    if (typeof itemHeight === 'function') {
      const cached = itemHeightsCache.current.get(item.id);
      if (cached) return cached;
      const height = itemHeight(item, index);
      itemHeightsCache.current.set(item.id, height);
      return height;
    }
    return itemHeight;
  }, [itemHeight]);

  // Clear cache when items change length
  useEffect(() => {
    itemHeightsCache.current.clear();
  }, [items.length]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return items.reduce((acc, item, index) => acc + getItemHeight(item, index), 0);
  }, [items, getItemHeight]);

  // Visible range
  const getVisibleRange = useCallback(() => {
    let accumulatedHeight = 0;
    let startIndex = 0;
    let endIndex = items.length - 1;

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i], i);
      if (accumulatedHeight + height > scrollTop - buffer * containerHeight) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }

    accumulatedHeight = 0;
    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i], i);
      accumulatedHeight += height;
      if (accumulatedHeight > scrollTop + containerHeight + buffer * containerHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
    }
    return { startIndex, endIndex };
  }, [items, scrollTop, containerHeight, buffer, overscan, getItemHeight]);

  const getOffsetForIndex = useCallback((index: number): number => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(items[i], i);
    }
    return offset;
  }, [items, getItemHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const newScrollTop = target.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);

    if (scrollRestoration) lastScrollPosition.current = newScrollTop;

    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => setIsScrolling(false), 120);

    if (onEndReached) {
      const scrollBottom = newScrollTop + containerHeight;
      if (scrollBottom >= totalHeight - endReachedThreshold) {
        const now = Date.now();
        if (lastEndCall.current.len !== items.length || now - lastEndCall.current.ts > 600) {
          lastEndCall.current = { len: items.length, ts: now };
          onEndReached();
        }
      }
    }
  }, [containerHeight, totalHeight, endReachedThreshold, onEndReached, scrollRestoration, items.length]);

  useEffect(() => {
    if (scrollRestoration && scrollerRef.current && lastScrollPosition.current > 0) {
      scrollerRef.current.scrollTop = lastScrollPosition.current;
    }
  }, [scrollRestoration]);

  const { startIndex, endIndex } = getVisibleRange();
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetTop = getOffsetForIndex(startIndex);

  const renderedItems = visibleItems.map((item, index) => {
    const actualIndex = startIndex + index;
    const height = getItemHeight(item, actualIndex);
    return (
      <div
        key={item.id}
        className="virtual-item"
        style={{
          position: 'absolute',
          top: offsetTop + getOffsetForIndex(actualIndex) - getOffsetForIndex(startIndex),
          left: 0,
          right: 0,
          height,
          willChange: isScrolling ? 'transform' : 'auto'
        }}
      >
        {renderItem(item, actualIndex)}
      </div>
    );
  });

  return (
    <div
      ref={scrollerRef}
      className={`virtual-scroller ${className} ${isScrolling ? 'scrolling' : ''}`}
      onScroll={handleScroll}
      style={{ height: containerHeight, overflowY: 'auto', position: 'relative' }}
      role="list"
      aria-busy={isScrolling}
    >
      <div className="virtual-scroller-content" style={{ height: totalHeight, position: 'relative' }}>
        {renderedItems}

        {onEndReached && scrollTop + containerHeight >= totalHeight - endReachedThreshold && (
          <div className="virtual-scroller-loading" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="loading-spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
