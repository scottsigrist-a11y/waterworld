import React from 'react';

interface SeagullSvgProps {
  heading: number; // degrees, 0 = up / North
  size?: number;
}

export const SeagullSvg: React.FC<SeagullSvgProps> = ({ heading, size = 44 }) => {
  return (
    <div
      className="relative flex items-center justify-center pointer-events-none"
      style={{
        width: size,
        height: size,
        transform: `rotate(${heading}deg)`,
        transition: 'transform 0.15s linear',
      }}
    >
      {/* Ground shadow */}
      <div
        className="absolute rounded-full bg-black/35 blur-[3px]"
        style={{
          width: size * 0.7,
          height: size * 0.4,
          transform: 'translate(4px, 12px) scale(0.85)',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="relative drop-shadow-md overflow-visible"
      >
        <defs>
          <style>{`
            @keyframes flapLeft {
              0% { transform: rotate(0deg) scaleY(1); }
              50% { transform: rotate(26deg) scaleY(0.65) translateY(-4px); }
              100% { transform: rotate(0deg) scaleY(1); }
            }
            @keyframes flapRight {
              0% { transform: rotate(0deg) scaleY(1); }
              50% { transform: rotate(-26deg) scaleY(0.65) translateY(-4px); }
              100% { transform: rotate(0deg) scaleY(1); }
            }
            .wing-l {
              transform-origin: 46px 48px;
              animation: flapLeft 0.55s ease-in-out infinite;
            }
            .wing-r {
              transform-origin: 54px 48px;
              animation: flapRight 0.55s ease-in-out infinite;
            }
          `}</style>
          <linearGradient id="gullBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#ECEFF1" />
            <stop offset="100%" stopColor="#CFD8DC" />
          </linearGradient>
          <linearGradient id="gullWing" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ECEFF1" />
            <stop offset="60%" stopColor="#B0BEC5" />
            <stop offset="100%" stopColor="#37474F" />
          </linearGradient>
        </defs>

        {/* Tail feathers */}
        <path
          d="M 47 68 L 50 82 L 53 68 Z"
          fill="#ECEFF1"
          stroke="#90A4AE"
          strokeWidth="0.8"
        />

        {/* Left Wing */}
        <g className="wing-l">
          <path
            d="M 47 48 C 36 44 20 38 6 42 C 14 50 28 56 46 54 Z"
            fill="url(#gullWing)"
            stroke="#546E7A"
            strokeWidth="0.8"
          />
          {/* Black primary tip */}
          <path
            d="M 6 42 C 10 45 16 48 18 49 C 14 47 9 44 6 42 Z"
            fill="#212121"
          />
        </g>

        {/* Right Wing */}
        <g className="wing-r">
          <path
            d="M 53 48 C 64 44 80 38 94 42 C 86 50 72 56 54 54 Z"
            fill="url(#gullWing)"
            stroke="#546E7A"
            strokeWidth="0.8"
          />
          {/* Black primary tip */}
          <path
            d="M 94 42 C 90 45 84 48 82 49 C 86 47 91 44 94 42 Z"
            fill="#212121"
          />
        </g>

        {/* Torso & Head */}
        <ellipse cx="50" cy="50" rx="6.5" ry="16" fill="url(#gullBody)" stroke="#90A4AE" strokeWidth="0.8" />
        <circle cx="50" cy="30" r="5" fill="#FFFFFF" stroke="#90A4AE" strokeWidth="0.8" />

        {/* Yellow Beak */}
        <polygon points="48,26 52,26 50,16" fill="#FBC02D" stroke="#E65100" strokeWidth="0.6" />
        {/* Red spot on seagull lower mandible */}
        <circle cx="50" cy="21" r="0.9" fill="#D32F2F" />

        {/* Eyes */}
        <circle cx="47.5" cy="29" r="0.8" fill="#212121" />
        <circle cx="52.5" cy="29" r="0.8" fill="#212121" />
      </svg>
    </div>
  );
};
