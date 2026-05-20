import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import DealWeekCard from './DealWeekCard';

const AUTO_ADVANCE_MS = 5000;

export default function DealsOfWeekPanel() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const loadDeals = useCallback(() => {
    setLoading(true);
    axios.get('/api/products/deals/week')
      .then((res) => setDeals(res.data.deals || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  useEffect(() => {
    setIndex(0);
  }, [deals.length]);

  useEffect(() => {
    if (deals.length <= 1 || paused) return undefined;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % deals.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [deals.length, paused]);

  const handleExpire = useCallback((productId) => {
    setDeals((prev) => {
      const next = prev.filter((p) => p._id !== productId);
      setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, []);

  const activeDeal = deals[index];

  return (
    <div className="overflow-hidden rounded-2xl border border-theme bg-theme-panel shadow-[var(--shadow)]">
      <div className="flex items-center justify-between gap-2 bg-accent px-4 py-3.5 font-black text-on-accent">
        <span className="flex min-w-0 items-center gap-2 text-sm md:text-base">
          <Menu size={17} className="shrink-0" />
          <span className="truncate">Deals of the Week</span>
        </span>
        {deals.length > 1 && (
          <span className="shrink-0 text-xs font-bold tabular-nums text-white/90">
            {index + 1} / {deals.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid place-items-center p-12 text-theme-muted">Loading deals…</div>
      ) : deals.length === 0 ? (
        <div className="p-8 text-center text-theme-muted">
          <p className="font-semibold text-theme">No active deals right now</p>
          <p className="mt-2 text-sm">Check back soon for limited-time offers.</p>
        </div>
      ) : (
        <div
          className="deals-week-carousel relative overflow-hidden"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeDeal._id}
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -48 }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            >
              <DealWeekCard
                product={activeDeal}
                compact
                onExpire={() => handleExpire(activeDeal._id)}
              />
            </motion.div>
          </AnimatePresence>

          {deals.length > 1 && (
            <div className="flex justify-center gap-2 px-4 pb-5" role="tablist" aria-label="Deal slides">
              {deals.map((deal, i) => (
                <button
                  key={deal._id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show deal ${i + 1}: ${deal.name}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index ? 'w-6 bg-accent' : 'w-2 bg-[var(--surface-3)] hover:bg-accent/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
