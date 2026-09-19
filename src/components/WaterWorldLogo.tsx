import React from 'react';

interface WaterWorldLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WaterWorldLogo: React.FC<WaterWorldLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const scale = size === 'sm' ? 0.8 : size === 'lg' ? 1.3 : 1.05;

  return (
    <div
      id="waterworld-movie-logo"
      className={`relative inline-flex flex-col items-center select-none pointer-events-auto filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] ${className}`}
      style={{ transform: `scale(${scale})`, transformOrigin: 'bottom left' }}
    >
      <svg
        viewBox="0 0 340 92"
        className="w-52 sm:w-64 md:w-72 h-auto overflow-visible"
      >
        <defs>
          {/* Luminous Chrome & Aqua Metallic Gradient */}
          <linearGradient id="wwMetalGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#D9FBFF" />
            <stop offset="42%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#0284C7" />
            <stop offset="78%" stopColor="#0369A1" />
            <stop offset="90%" stopColor="#082F49" />
            <stop offset="100%" stopColor="#031622" />
          </linearGradient>

          {/* Brilliant Golden-Amber Sun Glint & Cyan Patina Bevel */}
          <linearGradient id="wwGlintGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="25%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#00F0FF" />
            <stop offset="75%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>

          {/* Oceanic Cyan Flare Gradient for Backlight */}
          <radialGradient id="wwBacklight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#0284C7" stopOpacity="0.25" />
            <stop offset="85%" stopColor="#0369A1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Top highlight glint */}
          <linearGradient id="wwTopSheen" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </linearGradient>

          {/* Subtle stylized brushed metallic grain filter */}
          <filter id="wwGrain" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.18 0" result="colormat" />
            <feComposite in="SourceGraphic" in2="colormat" operator="atop" />
          </filter>
        </defs>

        {/* Ambient Vibrant Cyan Backlight Glow */}
        <ellipse cx="170" cy="46" rx="160" ry="36" fill="url(#wwBacklight)" filter="blur(12px)" />

        {/* Dynamic Horizon Waterline with Oceanic Ripple */}
        <path
          d="M 5 66 Q 45 61 85 66 T 170 62 T 255 67 T 335 63"
          fill="none"
          stroke="#00F0FF"
          strokeWidth="2.5"
          strokeOpacity="0.9"
          strokeLinecap="round"
          filter="drop-shadow(0 0 6px #00F0FF)"
        />
        <path
          d="M 20 70 Q 60 67 100 70 T 180 67 T 260 71 T 320 68"
          fill="none"
          stroke="#38BDF8"
          strokeWidth="1.2"
          strokeOpacity="0.6"
          strokeDasharray="5 3"
        />

        {/* Deep Solid Black 3D Extrusion (Bottom Offset) */}
        <text
          x="172"
          y="57"
          textAnchor="middle"
          fontSize="43"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          letterSpacing="5.5"
          fill="#02080D"
          stroke="#000000"
          strokeWidth="8"
          strokeLinejoin="round"
        >
          WATERWORLD
        </text>

        {/* Outer Dark Teal Outline Frame */}
        <text
          x="170"
          y="54"
          textAnchor="middle"
          fontSize="43"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          letterSpacing="5.5"
          fill="#041F2D"
          stroke="#001824"
          strokeWidth="5"
          strokeLinejoin="round"
        >
          WATERWORLD
        </text>

        {/* Bright Stylized Chrome Body with Metallic Grain */}
        <text
          x="170"
          y="54"
          textAnchor="middle"
          fontSize="43"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          letterSpacing="5.5"
          fill="url(#wwMetalGrad)"
          stroke="#0C4A6E"
          strokeWidth="1.8"
          filter="url(#wwGrain)"
        >
          WATERWORLD
        </text>

        {/* Top Metallic Sheen Bevel Overlay */}
        <text
          x="170"
          y="54"
          textAnchor="middle"
          fontSize="43"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          letterSpacing="5.5"
          fill="url(#wwTopSheen)"
          stroke="none"
        >
          WATERWORLD
        </text>

        {/* Sharp Glint Edge Contour (Golden-Cyan Sun Glint) */}
        <text
          x="170"
          y="53.5"
          textAnchor="middle"
          fontSize="43"
          fontWeight="900"
          fontFamily="'Arial Black', 'Impact', sans-serif"
          letterSpacing="5.5"
          fill="none"
          stroke="url(#wwGlintGrad)"
          strokeWidth="1.2"
          strokeOpacity="0.95"
        >
          WATERWORLD
        </text>

        {/* Decorative Sun Star Glint on the 'W' and 'D' */}
        <g transform="translate(42, 28) scale(0.65)">
          <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#FFFFFF" filter="drop-shadow(0 0 3px #00F0FF)" />
        </g>
        <g transform="translate(295, 30) scale(0.6)">
          <path d="M 0 -8 L 2 -2 L 8 0 L 2 2 L 0 8 L -2 2 L -8 0 L -2 -2 Z" fill="#FFE066" filter="drop-shadow(0 0 3px #F59E0B)" />
        </g>

        {/* Stylized Subtitle with High Contrast & Neon Aqua Glow */}
        <text
          x="170"
          y="79"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="8"
          fill="#38BDF8"
          stroke="#02080D"
          strokeWidth="2.5"
          paintOrder="stroke fill"
          filter="drop-shadow(0 0 5px rgba(56,189,248,0.8))"
        >
          BEYOND THE HORIZON
        </text>
        <text
          x="170"
          y="79"
          textAnchor="middle"
          fontSize="9"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="8"
          fill="#E0F7FA"
        >
          BEYOND THE HORIZON
        </text>
      </svg>
    </div>
  );
};
