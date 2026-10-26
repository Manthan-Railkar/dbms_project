import React from 'react';

// Slashed circle icon for Match Format exactly matching reference image
export function CricketBallFormatIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="9.5" fill="#0f172a" />
      <line x1="5.5" y1="18.5" x2="18.5" y2="5.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// Blue circle logo with swooshes (Tech Titans)
export function TechTitansLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-400 shadow-md ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full p-1.5" fill="none">
        <circle cx="50" cy="50" r="48" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        {/* Dynamic futuristic swooshes */}
        <path
          d="M20 75 Q45 20 82 28"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M28 84 Q50 40 78 45"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M40 89 Q60 60 76 62"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// Red circle logo with fierce lion silhouette (Code Strikers)
export function CodeStrikersLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`relative rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-tr from-red-800 via-red-600 to-rose-500 shadow-md ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full p-2" fill="none">
        <circle cx="50" cy="50" r="48" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
        {/* Stylized roaring lion head */}
        <path
          d="M50 20 C65 20 78 32 75 48 C72 60 62 70 50 78 C38 70 28 60 25 48 C22 32 35 20 50 20 Z"
          fill="rgba(0,0,0,0.15)"
        />
        <path
          d="M50 25 L55 35 L68 32 L60 42 L72 48 L58 52 L62 65 L50 56 L38 65 L42 52 L28 48 L40 42 L32 32 L45 35 Z"
          fill="white"
        />
        <circle cx="43" cy="42" r="2.5" fill="#991b1b" />
        <circle cx="57" cy="42" r="2.5" fill="#991b1b" />
        <path d="M46 51 Q50 54 54 51" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Golden 3D Toss Coin
export function TossCoinGraphic({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(234,179,8,0.5)]">
        <defs>
          <radialGradient id="goldGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#eab308" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="54" rx="42" ry="32" fill="#713f12" />
        <ellipse cx="50" cy="50" rx="42" ry="32" fill="url(#edgeGrad)" />
        <ellipse cx="50" cy="48" rx="38" ry="28" fill="url(#goldGrad)" />
        <ellipse cx="50" cy="48" rx="33" ry="24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Bat and Ball Symbol */}
        <path d="M38 52 L56 38 L62 44 L44 58 Z" fill="#854d0e" opacity="0.6" />
        <circle cx="48" cy="47" r="5" fill="#854d0e" opacity="0.7" />
      </svg>
    </div>
  );
}

// Step 1 Header Right Graphic: Cricket Ball on Pitch Grass with Stadium Floodlights
export function StadiumBallHeaderGraphic() {
  return (
    <div className="hidden sm:block relative w-48 h-28 pointer-events-none select-none">
      <svg viewBox="0 0 200 110" className="w-full h-full" fill="none">
        <defs>
          <radialGradient id="floodlight" cx="80%" cy="10%" r="70%">
            <stop offset="0%" stopColor="rgba(254,240,138,0.5)" />
            <stop offset="40%" stopColor="rgba(56,189,248,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="redBallGrad" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="35%" stopColor="#dc2626" />
            <stop offset="75%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>
        </defs>
        {/* Stadium Tower Light */}
        <polygon points="170,5 185,5 188,30 167,30" fill="rgba(255,255,255,0.3)" />
        <circle cx="177" cy="18" r="16" fill="url(#floodlight)" />
        
        {/* Pitch Green Grass curve */}
        <path d="M0,95 Q100,75 200,85 L200,110 L0,110 Z" fill="#15803d" />
        <path d="M0,99 Q100,82 200,90 L200,110 L0,110 Z" fill="#166534" />

        {/* Cricket Ball */}
        <g transform="translate(142, 60)">
          {/* Shadow */}
          <ellipse cx="22" cy="38" rx="22" ry="7" fill="rgba(0,0,0,0.4)" />
          {/* Red Ball Body */}
          <circle cx="20" cy="20" r="20" fill="url(#redBallGrad)" />
          {/* White Seam */}
          <path
            d="M5,16 Q20,24 35,24"
            stroke="white"
            strokeWidth="1.8"
            strokeDasharray="2.5 1.5"
            strokeLinecap="round"
          />
          <path
            d="M5,16 Q20,24 35,24"
            stroke="rgba(0,0,0,0.35)"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ mixBlendMode: 'multiply' }}
          />
          {/* Highlight */}
          <ellipse cx="14" cy="12" rx="4" ry="2.5" transform="rotate(-30 14 12)" fill="rgba(255,255,255,0.4)" />
        </g>
      </svg>
    </div>
  );
}

// Step 2 Header Graphic: Cheering Stadium Crowd Silhouette
export function StadiumCrowdHeaderGraphic() {
  return (
    <div className="hidden sm:block relative w-44 h-28 pointer-events-none select-none">
      <svg viewBox="0 0 180 110" className="w-full h-full" fill="none">
        <defs>
          <radialGradient id="stadiumLight" cx="60%" cy="15%" r="65%">
            <stop offset="0%" stopColor="rgba(253,224,71,0.45)" />
            <stop offset="45%" stopColor="rgba(59,130,246,0.2)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        {/* Stadium Tower Light */}
        <polygon points="120,5 138,5 140,25 118,25" fill="rgba(255,255,255,0.3)" />
        <circle cx="129" cy="15" r="22" fill="url(#stadiumLight)" />

        {/* Crowd Silhouettes */}
        <path
          d="M0 110 L0 88 Q15 82 25 88 Q35 78 45 84 Q55 75 70 82 Q85 73 95 80 Q105 70 120 78 Q135 65 150 75 Q165 60 175 70 L180 65 L180 110 Z"
          fill="#030712"
          opacity="0.8"
        />
        {/* Cheering fans hands up */}
        <path d="M142 62 L138 48 L142 45 L146 50 Z" fill="#030712" opacity="0.8" />
        <path d="M152 58 L155 42 L159 44 L156 56 Z" fill="#030712" opacity="0.8" />
        <circle cx="147" cy="56" r="4.5" fill="#030712" opacity="0.8" />
      </svg>
    </div>
  );
}

// Step 4 Header Graphic: Wickets & Floodlights
export function WicketsHeaderGraphic() {
  return (
    <div className="hidden sm:block relative w-44 h-28 pointer-events-none select-none">
      <svg viewBox="0 0 180 110" className="w-full h-full" fill="none">
        <defs>
          <radialGradient id="stumpLight" cx="70%" cy="20%" r="60%">
            <stop offset="0%" stopColor="rgba(254,240,138,0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="130" cy="20" r="30" fill="url(#stumpLight)" />
        {/* 3 Stumps and Bails */}
        <g transform="translate(115, 45)">
          {/* Bails */}
          <rect x="0" y="0" width="34" height="3" rx="1.5" fill="#fde047" opacity="0.9" />
          {/* Stumps */}
          <rect x="3" y="3" width="5" height="48" rx="2" fill="#e2e8f0" />
          <rect x="14" y="3" width="5" height="48" rx="2" fill="#e2e8f0" />
          <rect x="25" y="3" width="5" height="48" rx="2" fill="#e2e8f0" />
          {/* Ground */}
          <ellipse cx="17" cy="51" rx="24" ry="4" fill="rgba(0,0,0,0.4)" />
        </g>
      </svg>
    </div>
  );
}

// Role Badge (Batter blue, Bowler orange, All-rounder purple, Wicketkeeper green)
export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'Batter':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          Batter
        </span>
      );
    case 'All-rounder':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
          All-rounder
        </span>
      );
    case 'Bowler':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
          Bowler
        </span>
      );
    case 'Wicketkeeper':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
          Wicketkeeper
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {role}
        </span>
      );
  }
}
