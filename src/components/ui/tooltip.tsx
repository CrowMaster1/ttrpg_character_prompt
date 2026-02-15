import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  className?: string;
}

export function Tooltip({ content, className = '' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, placement: 'right' as 'right' | 'left' });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 280; // Slightly wider for better readability
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const gap = 8;

      // Check available space on each side
      const spaceRight = viewportWidth - rect.right;
      const spaceLeft = rect.left;
      const spaceBelow = viewportHeight - rect.bottom;

      // Prefer left side to avoid overlapping right column
      if (spaceLeft > tooltipWidth + gap) {
        // Position to the left
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX - tooltipWidth - gap,
          placement: 'left',
        });
      } else if (spaceRight > tooltipWidth + gap) {
        // Position to the right
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.right + window.scrollX + gap,
          placement: 'right',
        });
      } else {
        // Position above if no horizontal space
        setPosition({
          top: rect.top + window.scrollY - 80, // Approximate tooltip height
          left: Math.max(gap, rect.left + window.scrollX - tooltipWidth / 2),
          placement: 'left',
        });
      }
    }
  }, [show]);

  if (!content || content === 'None') return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShow(!show);
        }}
        className={`inline-flex items-center text-gray-500 hover:text-gray-700 transition-colors ml-1 ${className}`}
        style={{ verticalAlign: 'middle' }}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {show && createPortal(
        <div
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 9999,
            width: '280px',
          }}
          className="p-3 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-xl text-xs leading-relaxed"
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
        >
          {content}
          {position.placement === 'left' ? (
            <div className="absolute -right-1 top-2 w-2 h-2 bg-white border-r border-t border-gray-300 rotate-45" />
          ) : (
            <div className="absolute -left-1 top-2 w-2 h-2 bg-white border-l border-b border-gray-300 rotate-45" />
          )}
        </div>,
        document.body
      )}
    </>
  );
}
