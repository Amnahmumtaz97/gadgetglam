import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

function normalizeOptions(options) {
  return (options || []).map((opt) => {
    if (typeof opt === 'string') return { value: opt, label: opt };
    return { value: String(opt.value), label: opt.label ?? String(opt.value) };
  });
}

export default function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className,
  menuClassName,
  size = 'md',
  align = 'left',
  fullWidth = false,
  disabled = false,
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();
  const items = normalizeOptions(options);
  const selected = items.find((item) => item.value === String(value));
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const sizeClasses = {
    sm: 'min-h-[36px] gap-2 px-3 py-2 text-xs',
    md: 'min-h-[44px] gap-2.5 px-4 py-2.5 text-sm',
  };

  const pick = (next) => {
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn('relative inline-block', fullWidth && 'w-full', className)}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          'select-menu-trigger inline-flex w-full items-center justify-between rounded-2xl border border-theme bg-theme-panel font-semibold text-theme shadow-[var(--shadow)] transition',
          'hover:border-accent hover:bg-accent-light/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          open && 'border-accent ring-2 ring-accent/20',
          disabled && 'cursor-not-allowed opacity-55',
          sizeClasses[size] || sizeClasses.md,
        )}
      >
        <span className={cn('truncate', !selected && 'text-theme-muted')}>{displayLabel}</span>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          className={cn('shrink-0 text-accent transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={cn(
            'select-menu-panel absolute z-[120] mt-2 max-h-72 min-w-full overflow-auto rounded-2xl border border-theme bg-[var(--panel-strong)] p-1.5 shadow-[var(--shadow-lg)]',
            align === 'right' ? 'right-0' : 'left-0',
            'select-menu-panel',
            menuClassName,
          )}
        >
          {items.map((item) => {
            const active = item.value === String(value);
            return (
              <li key={item.value || '__empty'} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(item.value)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition',
                    active
                      ? 'bg-accent text-on-accent shadow-[0_8px_20px_rgba(37,99,235,0.2)]'
                      : 'text-theme-secondary hover:bg-accent-light hover:text-theme',
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  {active ? <Check size={16} className="shrink-0 opacity-95" aria-hidden /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
