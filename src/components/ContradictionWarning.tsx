import { useState } from 'react';
import { AlertTriangle, X, Info, AlertCircle } from 'lucide-react';

interface ContradictionRule {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  affectedControls?: string[];
}

interface ContradictionWarningProps {
  contradiction: ContradictionRule;
  onResolve?: () => void; // Auto-fix callback
  onDismiss?: () => void; // Dismiss warning
  onNavigate?: (controlId: string) => void; // Navigate to control
}

export function ContradictionWarning({
  contradiction,
  onResolve,
  onDismiss,
  onNavigate
}: ContradictionWarningProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getIcon = () => {
    switch (contradiction.severity) {
      case 'error':
        return <X size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'info':
        return <Info size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getSeverityClass = () => {
    switch (contradiction.severity) {
      case 'error':
        return 'contradiction-error';
      case 'warning':
        return 'contradiction-warning';
      case 'info':
        return 'contradiction-info';
      default:
        return 'contradiction-warning';
    }
  };

  return (
    <div
      className={`contradiction-badge ${getSeverityClass()}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {getIcon()}

      {showTooltip && (
        <div className="contradiction-tooltip">
          <div className="contradiction-tooltip-header">
            <span className="contradiction-tooltip-title">
              {contradiction.severity === 'error' ? 'Error' :
               contradiction.severity === 'warning' ? 'Warning' : 'Info'}
            </span>
            {onDismiss && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="contradiction-dismiss"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p className="contradiction-message">{contradiction.message}</p>

          {contradiction.suggestion && (
            <p className="contradiction-suggestion">
              <strong>Suggestion:</strong> {contradiction.suggestion}
            </p>
          )}

          {contradiction.affectedControls && contradiction.affectedControls.length > 0 && (
            <div className="contradiction-controls">
              <strong>Affected:</strong>{' '}
              {onNavigate ? (
                contradiction.affectedControls.map((controlId, idx) => (
                  <span key={controlId}>
                    {idx > 0 && ', '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(controlId);
                      }}
                      className="contradiction-control-link"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0066cc',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        font: 'inherit'
                      }}
                    >
                      {controlId}
                    </button>
                  </span>
                ))
              ) : (
                contradiction.affectedControls.join(', ')
              )}
            </div>
          )}

          {onResolve && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
              className="contradiction-fix-button"
            >
              Auto-Fix
            </button>
          )}

          <div className="contradiction-tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
