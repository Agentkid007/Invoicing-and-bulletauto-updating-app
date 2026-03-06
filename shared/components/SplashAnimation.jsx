/**
 * shared/components/SplashAnimation.jsx
 * Reusable startup splash animation for BulletAuto (web / Electron).
 *
 * Animation sequence (total ≈ 3–4 s):
 *   Phase 0 – intro  (0.72 s) : Emblem rotates in like a BMW wheel with blue glow.
 *   Phase 1 – reveal (0.55 s) : Smile fades in; monitor outline slides upward.
 *   Phase 2 – text   (0.90 s) : "KIDDY" wipes in with gradient; "PRODUCTIONS" fades in.
 *   Phase 3 – outro  (0.85 s) : Blue pulse ring radiates outward; logo settles.
 *   Exit              (0.45 s) : Whole overlay fades out; onComplete() is called.
 *
 * Props
 *   logo      {string}   – URL / import path for the logo image (default: /kiddy-logo.png)
 *   appName   {string}   – Brand name shown below the emblem   (default: "KIDDY")
 *   duration  {number}   – Total ms before onComplete fires     (default: 3500)
 *   onComplete{function} – Called after the overlay fully fades
 */
import React, { useEffect, useState } from 'react';
import './SplashAnimation.css';

/* SVG emblem – recreates the Kiddy Productions monitor/smiley mark so each
   element can be animated independently (circle, crosshair, eyes, smile,
   monitor frame). The actual logo PNG is shown as the final settled state.   */
function KiddyEmblemSVG({ showSmile, showMonitor }) {
  return (
    <svg
      className="splash-logo-svg"
      viewBox="0 0 220 230"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="blueGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="monitorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a2a5e" />
          <stop offset="100%" stopColor="#0d1520" />
        </linearGradient>
        <linearGradient id="circleGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#0d1a3a" />
          <stop offset="100%" stopColor="#101c38" />
        </linearGradient>
      </defs>

      {/* ── Monitor body ──────────────────────────────────────────────────── */}
      <g className={`splash-monitor-frame${showMonitor ? ' visible' : ''}`}>
        <rect
          x="22" y="18" width="162" height="150"
          rx="22" ry="22"
          fill="url(#monitorGrad)"
          stroke="#1e5fc7" strokeWidth="2.8"
          filter="url(#blueGlow)"
        />
        {/* Camera / viewfinder indicator – top-right */}
        <rect
          x="174" y="10" width="20" height="20"
          rx="5" ry="5"
          fill="#0d1520" stroke="#4a7fd4" strokeWidth="1.8"
        />
        {/* Monitor stand */}
        <rect x="88" y="168" width="44" height="14" rx="4" fill="#1a2550" />
        <rect x="68" y="180" width="84" height="9"  rx="5" fill="#1a2550" />
      </g>

      {/* ── Circular emblem ───────────────────────────────────────────────── */}
      {/* Emblem bg */}
      <circle cx="103" cy="90" r="57" fill="url(#circleGrad)" filter="url(#blueGlow)" />
      {/* Outer ring */}
      <circle cx="103" cy="90" r="57" fill="none" stroke="#2677e8" strokeWidth="3.2" />
      {/* Crosshair – vertical */}
      <line x1="103" y1="33" x2="103" y2="147" stroke="#2677e8" strokeWidth="1.6" opacity="0.65" />
      {/* Crosshair – horizontal */}
      <line x1="46"  y1="90" x2="160" y2="90"  stroke="#2677e8" strokeWidth="1.6" opacity="0.65" />

      {/* ── Eyes ──────────────────────────────────────────────────────────── */}
      <circle cx="83"  cy="75" r="8.5" fill="#c5dcff" />
      <circle cx="123" cy="75" r="8.5" fill="#c5dcff" />

      {/* ── Smile (visible only after reveal phase) ───────────────────────── */}
      <g className={`splash-smile${showSmile ? ' visible' : ''}`}>
        <path
          d="M 73 104 Q 103 132 133 104"
          stroke="#c5dcff" strokeWidth="4.5" fill="none" strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

export default function SplashAnimation({
  logo     = '/kiddy-logo.png',
  appName  = 'KIDDY',
  duration = 3500,
  onComplete,
}) {
  // phases: 'intro' → 'reveal' → 'text' → 'outro' → (exit)
  const [phase,    setPhase]    = useState('intro');
  const [exiting,  setExiting]  = useState(false);

  // One-shot visibility flags (true once set, never false again)
  const [showSmile,    setShowSmile]    = useState(false);
  const [showMonitor,  setShowMonitor]  = useState(false);
  const [showKiddy,    setShowKiddy]    = useState(false);
  const [showProd,     setShowProd]     = useState(false);

  // Keep a stable ref to onComplete so the one-shot effect always calls the
  // latest version without adding it to the effect's dependency array.
  const onCompleteRef = React.useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    // Schedule phase transitions (fires once on mount)
    const t1 = setTimeout(() => { setPhase('reveal');  setShowSmile(true);  setShowMonitor(true); }, 720);
    const t2 = setTimeout(() => { setPhase('text');    setShowKiddy(true);  setShowProd(true);    }, 1280);
    const t3 = setTimeout(() => { setPhase('outro');   }, 2200);
    const t4 = setTimeout(() => { setExiting(true);    }, 3100);
    const t5 = setTimeout(() => { onCompleteRef.current?.(); }, 3550);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, []); // intentionally empty — animation is a one-shot mount effect

  return (
    <div
      className={`splash-overlay splash-phase-${phase}${exiting ? ' splash-exiting' : ''}`}
      role="status"
      aria-label="Loading BulletAuto…"
    >
      <div className="splash-container">
        {/* Radial pulse ring (outro only) */}
        <div className="splash-pulse-ring" />

        {/* Animated SVG emblem */}
        <div className="splash-emblem">
          <KiddyEmblemSVG showSmile={showSmile} showMonitor={showMonitor} />
        </div>

        {/* Text: KIDDY + PRODUCTIONS */}
        <div className="splash-text">
          <div className={`splash-brand-name${showKiddy ? ' visible' : ''}`}>{appName}</div>
          <div className={`splash-brand-sub${showProd  ? ' visible' : ''}`}>PRODUCTIONS</div>
        </div>
      </div>
    </div>
  );
}
