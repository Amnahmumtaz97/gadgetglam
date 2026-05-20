import React, { useEffect, useState } from 'react';

function getParts(endDate) {
  const end = new Date(endDate).getTime();
  const diff = end - Date.now();
  if (!Number.isFinite(end) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    expired: false,
  };
}

function Unit({ value, label }) {
  return (
    <span className="promo-countdown-pill flex flex-col items-center justify-center rounded-full py-3 font-black leading-tight">
      <span className="text-base tabular-nums">{String(value).padStart(2, '0')}</span>
      <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
    </span>
  );
}

export default function CountdownTimer({ endsAt, onExpire }) {
  const [parts, setParts] = useState(() => getParts(endsAt));

  useEffect(() => {
    const tick = () => {
      const next = getParts(endsAt);
      setParts(next);
      if (next.expired && onExpire) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, onExpire]);

  if (parts.expired) {
    return <p className="mt-4 text-center text-sm font-semibold text-theme-muted">This offer has ended</p>;
  }

  return (
    <>
      <p className="mt-6 text-lg font-black text-accent">
        Hurry Up! <span className="text-theme">Offers end In :</span>
      </p>
      <div className="mt-4 grid grid-cols-4 gap-3 text-center text-xs">
        <Unit value={parts.days} label="Days" />
        <Unit value={parts.hours} label="Hours" />
        <Unit value={parts.minutes} label="Min" />
        <Unit value={parts.seconds} label="Sec" />
      </div>
    </>
  );
}
