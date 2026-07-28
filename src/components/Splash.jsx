import { useEffect, useState } from 'react';
import './Splash.css';

export default function Splash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), 1500);
    const t2 = setTimeout(() => onDone && onDone(), 2050);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className={'splash' + (leaving ? ' splash--leaving' : '')}>
      <div className="splash-logo">
        <svg viewBox="0 0 120 120" width="96" height="96">
          <defs>
            <linearGradient id="splashGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#EEF0FF" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="104" height="104" rx="28" fill="url(#splashGrad)" />
          <polyline
            points="24,84 46,66 62,74 82,44 100,52"
            fill="none"
            stroke="#5B4FE8"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="splash-line"
          />
          <circle cx="100" cy="52" r="6" fill="#FF7A3D" className="splash-dot" />
        </svg>
      </div>
      <div className="splash-title">iInvest</div>
    </div>
  );
}