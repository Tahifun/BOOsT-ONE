import React, { useState, useEffect, useRef } from 'react';
import './BatchActions.css';

interface BatchAction {
  id: string;
  label: string;
  icon: string;
  action: () => void | Promise<void>;
  variant?: 'default' | 'danger' | 'success';
  requiresConfirm?: boolean;
  disabled?: boolean;
}

interface BatchActionsProps {
  selectedCount: number;
  totalCount: number;
  actions: BatchAction[];
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onInvertSelection?: () => void;
  isAllSelected?: boolean;
  className?: string;
}

export const BatchActions: React.FC<BatchActionsProps> = ({
  selectedCount,
  totalCount,
  actions,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  isAllSelected = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BatchAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Maintain correct "indeterminate" state (HTML attribute is not supported)
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = selectedCount > 0 && selectedCount < totalCount;
    }
  }, [selectedCount, totalCount]);

  // Show/hide animation
  useEffect(() => {
    if (selectedCount > 0 && !isVisible) {
      setIsVisible(true);
    } else if (selectedCount === 0 && isVisible) {
      // Delay hiding for animation
      const t = window.setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [selectedCount, isVisible]);

  // Close more menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreActions(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMoreActions(false);
        if (showConfirmDialog) setShowConfirmDialog(false);
      }
    };
    if (showMoreActions || showConfirmDialog) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMoreActions, showConfirmDialog]);

  // Handle action execution
  const handleAction = async (action: BatchAction) => {
    if (action.requiresConfirm) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      await executeAction(action);
    }
  };

  // Execute action
  const executeAction = async (action: BatchAction) => {
    setIsProcessing(true);
    setShowConfirmDialog(false);
    setShowMoreActions(false);

    try {
      await action.action();
      
      // Show success animation
      showSuccessAnimation();
    } catch (error) {
      console.error('Batch action failed:', error);
      // Show error notification
      showErrorAnimation();
    } finally {
      setIsProcessing(false);
      setPendingAction(null);
    }
  };

  // Show success animation
  const showSuccessAnimation = () => {
    if (toolbarRef.current) {
      toolbarRef.current.classList.add('success');
      window.setTimeout(() => {
        toolbarRef.current?.classList.remove('success');
      }, 1000);
    }
  };

  // Show error animation
  const showErrorAnimation = () => {
    if (toolbarRef.current) {
      toolbarRef.current.classList.add('error');
      window.setTimeout(() => {
        toolbarRef.current?.classList.remove('error');
      }, 1000);
    }
  };

  // Split actions into primary and secondary
  const primaryActions = actions.slice(0, 4);
  const secondaryActions = actions.slice(4);

  if (!isVisible && selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        ref={toolbarRef}
        className={`batch-actions ${className} ${selectedCount > 0 ? 'visible' : 'hidden'} ${isProcessing ? 'processing' : ''}`}
        aria-live="polite"
      >
        {/* Selection Info */}
        <div className="batch-selection">
          <div className="selection-checkbox">
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={isAllSelected}
              onChange={() => {
                if (isAllSelected) {
                  onDeselectAll?.();
                } else {
                  onSelectAll?.();
                }
              }}
              aria-label="Alle ausw�hlen"
            />
          </div>
          
          <div className="selection-info">
            <span className="selection-count">
              {selectedCount} ausgew�hlt
            </span>
            {selectedCount < totalCount && (
              <span className="selection-total">
                von {totalCount}
              </span>
            )}
          </div>

          {/* Selection Controls */}
          <div className="selection-controls">
            {onSelectAll && selectedCount < totalCount && (
              <button
                className="selection-btn"
                onClick={onSelectAll}
                aria-label="Alle ausw�hlen"
                type="button"
              >
                Alle
              </button>
            )}
            {onDeselectAll && selectedCount > 0 && (
              <button
                className="selection-btn"
                onClick={onDeselectAll}
                aria-label="Auswahl aufheben"
                type="button"
              >
                Keine
              </button>
            )}
            {onInvertSelection && (
              <button
                className="selection-btn"
                onClick={onInvertSelection}
                aria-label="Auswahl umkehren"
                type="button"
              >
                Umkehren
              </button>
            )}
          </div>
        </div>

        {/* Action Separator */}
        <div className="batch-separator" />

        {/* Primary Actions */}
        <div className="batch-actions-list">
          {primaryActions.map((action) => (
            <button
              key={action.id}
              className={`batch-action-btn ${action.variant || 'default'} ${action.disabled ? 'disabled' : ''}`}
              onClick={() => handleAction(action)}
              disabled={action.disabled || isProcessing}
              aria-label={action.label}
              title={action.label}
              type="button"
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
              {action.requiresConfirm && (
                <span className="action-warning">??</span>
              )}
            </button>
          ))}

          {/* More Actions */}
          {secondaryActions.length > 0 && (
            <div className="more-actions-container" ref={moreMenuRef}>
              <button
                className="batch-action-btn more"
                onClick={() => setShowMoreActions(!showMoreActions)}
                aria-label="Weitere Aktionen"
                aria-expanded={showMoreActions}
                type="button"
              >
                <span className="action-icon">?</span>
              </button>

              {showMoreActions && (
                <div className="more-actions-menu">
                  {secondaryActions.map((action) => (
                    <button
                      key={action.id}
                      className={`menu-action ${action.variant || 'default'}`}
                      onClick={() => handleAction(action)}
                      disabled={action.disabled || isProcessing}
                      type="button"
                    >
                      <span className="menu-icon">{action.icon}</span>
                      <span className="menu-label">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="batch-processing" aria-live="assertive">
            <div className="processing-spinner" />
            <span className="processing-text">Verarbeite...</span>
          </div>
        )}

        {/* Close Button */}
        <button
          className="batch-close"
          onClick={onDeselectAll}
          aria-label="Auswahl aufheben und schlie�en"
          type="button"
        >
          ??
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && pendingAction && (
        <div className="batch-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <div className="batch-confirm-dialog">
            <div className="confirm-icon">
              {pendingAction.variant === 'danger' ? '??' : '?'}
            </div>
            <h3 id="confirm-title" className="confirm-title">Aktion best�tigen</h3>
            <p className="confirm-message">
              M�chten Sie "{pendingAction.label}" f�r {selectedCount} {selectedCount === 1 ? 'Element' : 'Elemente'} ausf�hren?
            </p>
            <div className="confirm-actions">
              <button
                className={`confirm-btn confirm-yes ${pendingAction.variant || 'default'}`}
                onClick={() => executeAction(pendingAction)}
                type="button"
              >
                {pendingAction.icon} Ja, ausf�hren
              </button>
              <button
                className="confirm-btn confirm-no"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingAction(null);
                }}
                type="button"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
