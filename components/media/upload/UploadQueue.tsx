
import React, { useState, useEffect, useCallback } from 'react';
import { FileWithValidation } from './DropZone';
import { UploadProgress } from './UploadProgress';
import './UploadQueue.css';

export interface QueueItem extends FileWithValidation {
  status: 'waiting' | 'uploading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  uploadedBytes: number;
  speed?: number;
  remainingTime?: number;
  error?: string;
  uploadId?: string;
  retryCount: number;
}

interface UploadQueueProps {
  files: FileWithValidation[];
  onUpload: (item: QueueItem) => Promise<void>;
  onRemove: (itemId: string) => void;
  onRetry: (itemId: string) => void;
  onPause: (itemId: string) => void;
  onResume: (itemId: string) => void;
  onClear: () => void;
  maxConcurrent?: number;
  autoStart?: boolean;
  className?: string;
}

type UploadProgressEvent = CustomEvent<{
  id: string;
  progress?: number;
  uploadedBytes?: number;
  speed?: number;
  remainingTime?: number;
  status?: QueueItem['status'];
  error?: string;
}>;

declare global {
  interface WindowEventMap {
    'upload:progress': UploadProgressEvent;
    'upload:status': UploadProgressEvent;
  }
}

export const UploadQueue: React.FC<UploadQueueProps> = ({
  files,
  onUpload,
  onRemove,
  onRetry,
  onPause,
  onResume,
  onClear,
  maxConcurrent = 3,
  autoStart = true,
  className = ''
}) => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'status'>('name');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Initialize queue from incoming files (append unique)
  useEffect(() => {
    if (!files?.length) return;
    setQueue(current => {
      const existing = new Set(current.map(i => i.id));
      const toAdd: QueueItem[] = files
        .filter(f => !existing.has(f.id))
        .map(f => ({ ...f, status: 'waiting', progress: 0, uploadedBytes: 0, retryCount: 0 }));
      return [...current, ...toAdd];
    });
  }, [files]);

  // External progress integration via CustomEvent
  useEffect(() => {
    const onProg = (e: UploadProgressEvent) => {
      const d = e.detail;
      setQueue(cur => cur.map(item => {
        if (item.id !== d.id) return item;
        return {
          ...item,
          progress: d.progress ?? item.progress,
          uploadedBytes: d.uploadedBytes ?? item.uploadedBytes,
          speed: d.speed ?? item.speed,
          remainingTime: d.remainingTime ?? item.remainingTime,
          status: d.status ?? item.status,
          error: d.error ?? item.error
        };
      }));
    };
    window.addEventListener('upload:progress', onProg as any);
    window.addEventListener('upload:status', onProg as any);
    return () => {
      window.removeEventListener('upload:progress', onProg as any);
      window.removeEventListener('upload:status', onProg as any);
    };
  }, []);

  // Upload worker
  useEffect(() => {
    if (!autoStart || !queue.length) return;
    const uploadingCount = queue.filter(i => i.status === 'uploading').length;
    const canStart = uploadingCount < maxConcurrent;
    if (!canStart) return;

    const next = queue.find(i => i.status === 'waiting');
    if (!next) return;

    setQueue(cur => cur.map(i => i.id === next.id ? { ...i, status: 'uploading' } : i));

    (async () => {
      try {
        await onUpload({ ...next, status: 'uploading' });
        setQueue(cur => cur.map(i => i.id === next.id ? { ...i, status: 'completed', progress: Math.max(100, i.progress) } : i));
      } catch (err: unknown) {
        setQueue(cur => cur.map(i => i.id === next.id ? { ...i, status: 'failed', error: err?.message || 'Upload fehlgeschlagen' } : i));
      }
    })();
  }, [queue, autoStart, maxConcurrent, onUpload]);

  // Overall uploading state
  useEffect(() => {
    const active = queue.some(i => ['waiting','uploading'].includes(i.status));
    setIsUploading(active);
  }, [queue]);

  const updateItemStatus = (id: string, status: QueueItem['status'], patch: Partial<QueueItem> = {}) => {
    setQueue(current => current.map(item => item.id === id ? { ...item, status, ...patch } : item));
  };

  const handleRemove = (id: string) => {
    setQueue(current => current.filter(i => i.id !== id));
    setSelectedItems(s => { const n = new Set(s); n.delete(id); return n; });
    onRemove(id);
  };

  const handleRetry = (id: string) => {
    updateItemStatus(id, 'waiting', { progress: 0, error: undefined, retryCount: (queue.find(i => i.id === id)?.retryCount || 0) + 1 });
    onRetry(id);
  };

  const handlePause = (id: string) => {
    updateItemStatus(id, 'paused');
    onPause(id);
  };

  const handleResume = (id: string) => {
    updateItemStatus(id, 'waiting');
    onResume(id);
  };

  const handleBatchAction = (action: 'remove' | 'retry' | 'pause' | 'resume') => {
    selectedItems.forEach(id => {
      if (action === 'remove') handleRemove(id);
      if (action === 'retry') handleRetry(id);
      if (action === 'pause') handlePause(id);
      if (action === 'resume') handleResume(id);
    });
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAll = () => setSelectedItems(new Set(queue.map(i => i.id)));
  const clearSelection = () => setSelectedItems(new Set());

  const sortQueue = (items: QueueItem[]): QueueItem[] => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') return a.file.name.localeCompare(b.file.name);
      if (sortBy === 'size') return b.file.size - a.file.size;
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      return 0;
    });
  };

  const filterQueue = (items: QueueItem[]): QueueItem[] => {
    if (filterStatus === 'all') return items;
    return items.filter(i => i.status === filterStatus);
  };

  const displayQueue = sortQueue(filterQueue(queue));

  const overallProgress = queue.length ? queue.reduce((sum, i) => sum + i.progress, 0) / queue.length : 0;

  const statusCounts = {
    waiting: queue.filter(i => i.status === 'waiting').length,
    uploading: queue.filter(i => i.status === 'uploading').length,
    completed: queue.filter(i => i.status === 'completed').length,
    failed: queue.filter(i => i.status === 'failed').length,
    paused: queue.filter(i => i.status === 'paused').length
  };

  return (
    <div className={`upload-queue ${className}`}>
      {/* Queue Header */}
      <div className="queue-header">
        <h3 className="queue-title">Upload-Warteschlange</h3>
        <div className="queue-actions">
          {selectedItems.size > 0 && (
            <div className="batch-actions">
              <span className="selected-count">{selectedItems.size} ausgew�hlt</span>
              <button className="action-btn" onClick={() => handleBatchAction('remove')} aria-label="Ausgew�hlte entfernen">?</button>
              <button className="action-btn" onClick={() => handleBatchAction('retry')} aria-label="Ausgew�hlte wiederholen"></button>
              <button className="action-btn" onClick={clearSelection} aria-label="Auswahl aufheben">?</button>
            </div>
          )}
          <div className="queue-controls">
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} aria-label="Sortierung">
              <option value="name">Name</option>
              <option value="size">Gr�e</option>
              <option value="status">Status</option>
            </select>
            <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter">
              <option value="all">Alle</option>
              <option value="waiting">Wartend</option>
              <option value="uploading">L�uft</option>
              <option value="completed">Fertig</option>
              <option value="failed">Fehler</option>
              <option value="paused">Pausiert</option>
            </select>
            {queue.length > 0 && (
              <button className="clear-btn" onClick={onClear} aria-label="Warteschlange leeren">Alle entfernen</button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      {queue.length > 0 && (
        <div className="overall-progress">
          <UploadProgress progress={overallProgress} label="Gesamtfortschritt" showPercentage size="small" />
          <div className="status-summary">
            <span className="status-item waiting">{statusCounts.waiting} wartend</span>
            <span className="status-item uploading">{statusCounts.uploading} l�uft</span>
            <span className="status-item completed">{statusCounts.completed} fertig</span>
            {statusCounts.failed > 0 && <span className="status-item failed">{statusCounts.failed} fehler</span>}
          </div>
        </div>
      )}

      {/* Queue Items */}
      <div className="queue-items">
        {displayQueue.length === 0 ? (
          <div className="queue-empty">
            <span className="empty-icon"></span>
            <p>Keine Dateien in der Warteschlange</p>
          </div>
        ) : (
          displayQueue.map(item => (
            <QueueRow
              key={item.id}
              item={item}
              isSelected={selectedItems.has(item.id)}
              onSelect={() => toggleItemSelection(item.id)}
              onRemove={() => handleRemove(item.id)}
              onRetry={() => handleRetry(item.id)}
              onPause={() => handlePause(item.id)}
              onResume={() => handleResume(item.id)}
            />
          ))
        )}
      </div>

      {/* Upload Controls */}
      {queue.length > 0 && (
        <div className="upload-controls">
          {isUploading ? (
            <button className="control-btn stop" onClick={() => setIsUploading(false)}>?? Upload pausieren</button>
          ) : (
            <button className="control-btn start" onClick={() => setIsUploading(true)}>? Upload starten</button>
          )}
        </div>
      )}
    </div>
  );
};

interface RowProps {
  item: QueueItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRetry: () => void;
  onPause: () => void;
  onResume: () => void;
}

const QueueRow: React.FC<RowProps> = ({ item, isSelected, onSelect, onRemove, onRetry, onPause, onResume }) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };
  const formatTime = (seconds?: number): string => {
    if (seconds == null || !isFinite(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const formatSpeed = (bps?: number): string => (bps ? formatFileSize(bps) + '/s' : '--/s');

  return (
    <div className={`queue-item ${item.status} ${isSelected ? 'selected' : ''}`}>
      <input type="checkbox" className="item-checkbox" checked={isSelected} onChange={onSelect} aria-label={`${item.file.name} ausw�hlen`} />
      <div className="item-preview">
        {item.preview ? <img src={item.preview} alt={item.file.name} /> : <span className="file-icon" aria-hidden="true"></span>}
      </div>
      <div className="item-info">
        <div className="item-name" title={item.file.name}>{item.file.name}</div>
        <div className="item-meta">
          <span className="item-size">{formatFileSize(item.file.size)}</span>
          {item.status === 'uploading' && (
            <>
              <span className="item-speed">{formatSpeed(item.speed)}</span>
              <span className="item-time">{formatTime(item.remainingTime)}</span>
            </>
          )}
          {item.retryCount > 0 && <span className="item-retry">Versuch {item.retryCount + 1}</span>}
        </div>
        {item.error && <div className="item-error">{item.error}</div>}
      </div>

      {item.status === 'uploading' && <UploadProgress progress={item.progress} size="tiny" />}

      <div className="item-status">
        <span className={`status-badge ${item.status}`}>
          {item.status === 'waiting' && '?'}
          {item.status === 'uploading' && ''}
          {item.status === 'completed' && ''}
          {item.status === 'failed' && ''}
          {item.status === 'paused' && '??'}
        </span>
      </div>

      <div className="item-actions">
        {item.status === 'failed' && <button className="item-btn" onClick={onRetry} aria-label="Wiederholen"></button>}
        {item.status === 'uploading' && <button className="item-btn" onClick={onPause} aria-label="Pausieren">??</button>}
        {item.status === 'paused' && <button className="item-btn" onClick={onResume} aria-label="Fortsetzen">?</button>}
        <button className="item-btn remove" onClick={onRemove} aria-label="Entfernen">?</button>
      </div>
    </div>
  );
};

