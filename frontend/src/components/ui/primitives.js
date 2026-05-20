import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

export { default as SelectMenu } from './SelectMenu';

export function GlassCard({ className = '', children, as: Component = 'div', ...props }) {
  return (
    <Component
      className={cn(
        'card-theme rounded-3xl backdrop-blur-xl',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function GradientButton({ className = '', children, as: Component = motion.button, ...props }) {
  const motionProps = Component === motion.button ? { whileHover: { scale: 1.02, y: -1 }, whileTap: { scale: 0.98 } } : {};
  return (
    <Component
      {...motionProps}
      className={cn('btn-primary px-4 py-2 text-sm', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function OutlineButton({ className = '', children, as: Component = motion.button, ...props }) {
  const motionProps = Component === motion.button ? { whileHover: { scale: 1.02, y: -1 }, whileTap: { scale: 0.98 } } : {};
  return (
    <Component
      {...motionProps}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl border border-theme bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] shadow-[var(--shadow)] transition hover:border-accent hover:bg-accent-light',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function SectionHeading({ eyebrow, title, accent, action }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
          {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p> : null}
        <h2 className="text-2xl font-black tracking-tight text-[var(--text-primary)] md:text-3xl">
          {title} {accent ? <span className="text-gradient">{accent}</span> : null}
        </h2>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatPill({ icon, label, value, dark = false }) {
  return (
    <div className={cn(
      'flex min-w-[140px] items-center gap-3 rounded-2xl px-3 py-2 backdrop-blur-xl',
      dark
        ? 'border border-white/10 bg-[rgba(255,255,255,0.06)] shadow-[0_16px_40px_rgba(0,0,0,0.22)]'
        : 'border border-theme bg-[var(--panel)] shadow-[var(--shadow)]',
    )}>
      <div className={cn('grid h-10 w-10 place-items-center rounded-2xl text-lg', dark ? 'bg-accent text-on-accent' : 'bg-accent-light text-accent')}>{icon}</div>
      <div>
        <div className={cn('text-base font-bold', dark ? 'text-white' : 'text-theme')}>{value}</div>
        <div className={cn('text-xs', dark ? 'text-gray-300' : 'text-theme-muted')}>{label}</div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-theme bg-theme-panel p-4 shadow-[0_12px_30px_rgba(17,17,17,0.07)]">
      <div className="h-56 rounded-xl bg-gray-100 bg-size-[200%_100%] animate-shimmer" style={{ backgroundImage: 'linear-gradient(90deg, rgba(17,17,17,0.04) 25%, var(--accent-yellow-faint) 37%, rgba(17,17,17,0.04) 63%)' }} />
      <div className="mt-4 space-y-3">
        <div className="h-4 w-2/3 rounded-full bg-gray-100" />
        <div className="h-4 w-1/2 rounded-full bg-gray-100" />
        <div className="h-10 rounded-2xl bg-gray-100" />
      </div>
    </div>
  );
}
