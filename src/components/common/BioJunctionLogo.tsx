import React from 'react';

interface BioJunctionLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'glass';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BioJunctionLogo: React.FC<BioJunctionLogoProps> = ({
  size = 'md',
  variant = 'light',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  // Dimensions mapping
  const dimensions = {
    sm: { icon: 28, text: 'text-lg', sub: 'text-[8px]' },
    md: { icon: 38, text: 'text-2xl', sub: 'text-[9px]' },
    lg: { icon: 48, text: 'text-3xl', sub: 'text-[11px]' },
    xl: { icon: 64, text: 'text-4xl', sub: 'text-[13px]' },
  }[size];

  const isLight = variant === 'light';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Bespoke DNA Junction Emblem */}
      <div className="relative flex-shrink-0 group">
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 group-hover:scale-105 group-hover:rotate-6 filter drop-shadow-md"
        >
          <defs>
            {/* Gradients using the luxury color scheme */}
            <linearGradient id="maroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3f0d12" />
              <stop offset="100%" stopColor="#7a1420" />
            </linearGradient>

            <linearGradient id="crimsonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d5bf86" />
              <stop offset="40%" stopColor="#a71d31" />
              <stop offset="100%" stopColor="#3f0d12" />
            </linearGradient>

            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f0cc" />
              <stop offset="50%" stopColor="#d5bf86" />
              <stop offset="100%" stopColor="#8d775f" />
            </linearGradient>

            <radialGradient id="junctionCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f1f0cc" />
              <stop offset="40%" stopColor="#d5bf86" />
              <stop offset="85%" stopColor="#a71d31" />
              <stop offset="100%" stopColor="#3f0d12" />
            </radialGradient>

            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#a71d31" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Outer Protective Kinetic Ring */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#goldGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            className="opacity-70 animate-[spin_40s_linear_infinite]"
          />
          <circle
            cx="50"
            cy="50"
            r="38"
            stroke={isLight ? '#8d775f' : '#67e8f9'}
            strokeWidth="0.75"
            strokeDasharray="2 4"
            className="opacity-40 animate-[spin_25s_linear_infinite_reverse]"
          />

          {/* DNA Strand 1: Ascending Wave */}
          <path
            d="M 20 80 C 35 70, 35 30, 50 50 C 65 70, 65 30, 80 20"
            stroke="url(#crimsonGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#logoGlow)"
          />

          {/* DNA Strand 2: Descending Wave (Crosses Strand 1 to form the Junction) */}
          <path
            d="M 20 20 C 35 30, 35 70, 50 50 C 65 30, 65 70, 80 80"
            stroke="url(#maroonGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Hydrogen Base-Pair Rungs / Connectors */}
          <line x1="28" y1="28" x2="28" y2="72" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
          <line x1="72" y1="28" x2="72" y2="72" stroke="url(#goldGrad)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
          <line x1="39" y1="41" x2="39" y2="59" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />
          <line x1="61" y1="41" x2="61" y2="59" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" />

          {/* Central Crossing Junction - The "Bio Junction" Diamond Hub */}
          <g transform="translate(50, 50)">
            <rect
              x="-8"
              y="-8"
              width="16"
              height="16"
              rx="4"
              transform="rotate(45)"
              fill="url(#junctionCore)"
              stroke="#f1f0cc"
              strokeWidth="1.5"
            />
            {/* Core Nucleotide Spark */}
            <circle cx="0" cy="0" r="2.5" fill="#f1f0cc" />
          </g>

          {/* 4 Cardinal Nucleotide Satellite Nodes (A, T, C, G representation) */}
          <circle cx="20" cy="20" r="3.5" fill="#a71d31" stroke="#f1f0cc" strokeWidth="1" />
          <circle cx="80" cy="20" r="3.5" fill="#d5bf86" stroke="#3f0d12" strokeWidth="1" />
          <circle cx="20" cy="80" r="3.5" fill="#d5bf86" stroke="#3f0d12" strokeWidth="1" />
          <circle cx="80" cy="80" r="3.5" fill="#3f0d12" stroke="#f1f0cc" strokeWidth="1" />
        </svg>
      </div>

      {/* Typography with Sophisticated Hierarchy */}
      <div className="flex flex-col justify-center">
        <div className={`font-black tracking-tight leading-none ${dimensions.text} flex items-baseline gap-1`}>
          <span style={{ color: isLight ? '#3f0d12' : '#f1f0cc' }}>
            BIO
          </span>
          <span className="relative" style={{ color: isLight ? '#a71d31' : '#f59e0b' }}>
            JUNCTION
            {/* Minimalist DNA dot badge */}
            <span
              className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full ring-2"
              style={{
                backgroundColor: '#d5bf86',
                boxShadow: '0 0 6px rgba(213, 191, 134, 0.8)',
              }}
            />
          </span>
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`font-mono uppercase tracking-[0.25em] font-bold ${dimensions.sub}`}
              style={{ color: isLight ? '#8d775f' : '#d5bf86' }}
            >
              DNA • Molecular Platform
            </span>
            <span className="w-1.5 h-px bg-[#d5bf86] inline-block" />
            <span
              className={`font-mono text-[7px] uppercase px-1 py-0.2 rounded border font-bold`}
              style={{
                borderColor: '#d5bf86',
                color: isLight ? '#3f0d12' : '#f1f0cc',
                backgroundColor: isLight ? 'rgba(213, 191, 134, 0.2)' : 'rgba(213, 191, 134, 0.15)',
              }}
            >
              v2.6
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
