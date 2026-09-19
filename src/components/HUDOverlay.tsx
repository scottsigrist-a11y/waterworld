import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Waves, Zap, Compass as ExploreIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { FlightMode } from '../types';
import { WaterWorldLogo } from './WaterWorldLogo';

interface HUDOverlayProps {
  score: number;
  floodableArea: number;
  isFlooding: boolean;
  flightMode: FlightMode;
  circleTimeRemaining: number;
  totalPathLength: number;
  onTriggerDpad?: (action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SELECT') => void;
  zoomMiles: number;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  score,
  floodableArea,
  isFlooding,
  flightMode,
  circleTimeRemaining,
  totalPathLength,
  onTriggerDpad,
  zoomMiles,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-4 sm:p-6 select-none overflow-hidden">
      {/* Top Bar */}
      <div className="w-full flex items-start justify-between gap-4">
        {/* Upper Left Hand: Score in large bold Golden letters surrounded by black glow */}
        <div id="hud-score" className="flex flex-col items-start pointer-events-auto">
          <div
            className="text-2xl sm:text-3xl font-black uppercase tracking-wider"
            style={{
              color: '#FFD700',
              textShadow:
                '0 0 12px #000, 0 0 8px #000, 0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000',
              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.95))',
            }}
          >
            Score:
          </div>
          <div
            className="text-3xl sm:text-5xl font-black leading-none flex items-baseline gap-1"
            style={{
              color: '#FFE066',
              textShadow:
                '0 0 14px #000, 0 0 8px #000, 0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000',
              filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.95))',
            }}
          >
            <span>{score.toFixed(2)}</span>
            <span className="text-lg sm:text-2xl font-bold text-amber-400">sq mi</span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-black/60 text-amber-200 backdrop-blur-xs border border-amber-500/30">
            <Waves className="w-3 h-3 text-cyan-400" />
            <span>Flooded Realm</span>
          </div>
        </div>

        {/* Center Top: MRBD Status Indicator */}
        <div className="hidden sm:flex flex-col items-center pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/75 border border-white/20 backdrop-blur-md text-white/90 text-xs font-mono shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>MRBD HUD</span>
            <span className="text-white/40">|</span>
            <span>View: ~{zoomMiles.toFixed(1)} mi</span>
            <span className="text-white/40">|</span>
            <span>Path: {totalPathLength.toFixed(2)} mi</span>
          </div>

          {flightMode === 'circle' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400 text-cyan-300 text-xs font-bold tracking-wider animate-pulse flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <Compass className="w-3.5 h-3.5 animate-spin" />
              <span>SEAGULL CIRCLING: {circleTimeRemaining.toFixed(0)}s (ENTER to Flood)</span>
            </motion.div>
          )}
        </div>

        {/* Upper Right Hand: Floodable in large bold letters & Complete List of Controls */}
        <div id="hud-floodable" className="flex flex-col items-end pointer-events-auto">
          <div
            className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-right"
            style={{
              color: '#FFFFFF',
              textShadow:
                '0 0 12px #000, 0 0 8px #000, 0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000',
              filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.95))',
            }}
          >
            Floodable:
          </div>
          <div
            className="text-3xl sm:text-5xl font-black leading-none flex items-baseline gap-1 text-right"
            style={{
              color: '#E0F7FA',
              textShadow:
                '0 0 14px #000, 0 0 8px #000, 0 0 4px #000, 2px 2px 0 #000, -2px -2px 0 #000',
              filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.95))',
            }}
          >
            <span>{floodableArea.toFixed(2)}</span>
            <span className="text-lg sm:text-2xl font-bold text-cyan-300">sq mi</span>
          </div>

          {/* Controls list directly under Floodable */}
          <div className="mt-2.5 flex flex-col items-end gap-1.5 font-mono text-[11px] sm:text-xs">
            {/* Swipe Left to Flood */}
            <button
              onClick={() => onTriggerDpad?.('LEFT')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-cyan-950/80 border border-cyan-400/40 text-cyan-200 backdrop-blur-md shadow-md transition cursor-pointer active:scale-95"
              title="Swipe Left to Flood"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-300 fill-cyan-400/30" />
              <span className="font-bold tracking-wide">Swipe Left to Flood</span>
            </button>

            {/* Swipe Right for Seagull to explore or return */}
            <button
              onClick={() => onTriggerDpad?.('RIGHT')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md shadow-md transition cursor-pointer active:scale-95 border ${
                flightMode === 'circle'
                  ? 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-400/60 text-amber-200 ring-1 ring-amber-400/30'
                  : 'bg-black/75 hover:bg-cyan-950/80 border-white/20 text-white/90'
              }`}
              title={
                flightMode === 'circle'
                  ? 'Swipe Right to return Seagull to path'
                  : 'Swipe Right for Seagull to explore'
              }
            >
              <ExploreIcon
                className={`w-3.5 h-3.5 ${flightMode === 'circle' ? 'text-amber-300' : 'text-cyan-400'}`}
              />
              <span className="font-medium tracking-wide">
                {flightMode === 'circle'
                  ? 'Swipe Right to return to path'
                  : 'Swipe Right for Seagull to explore'}
              </span>
            </button>

            {/* Up to zoom in */}
            <button
              onClick={() => onTriggerDpad?.('UP')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-cyan-950/80 border border-white/20 text-white/90 backdrop-blur-md shadow-md transition cursor-pointer active:scale-95"
              title="Swipe Up to zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-medium tracking-wide">Up to zoom in</span>
            </button>

            {/* Down to zoom out */}
            <button
              onClick={() => onTriggerDpad?.('DOWN')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-cyan-950/80 border border-white/20 text-white/90 backdrop-blur-md shadow-md transition cursor-pointer active:scale-95"
              title="Swipe Down to zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-medium tracking-wide">Down to zoom out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Center: "FLOODING" 1 second animation */}
      <AnimatePresence>
        {isFlooding && (
          <motion.div
            id="hud-flooding-banner"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.08, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-widest text-black"
              style={{
                textShadow: `
                  -4px -4px 0 #FFF, 4px -4px 0 #FFF, -4px 4px 0 #FFF, 4px 4px 0 #FFF,
                  -6px 0 0 #FFF, 6px 0 0 #FFF, 0 -6px 0 #FFF, 0 6px 0 #FFF,
                  0 0 35px #FFF, 0 0 60px rgba(0,210,255,0.9)
                `,
                filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.8))',
              }}
            >
              FLOODING
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Bar: Waterworld Logo (Clean layout with no box on lower right) */}
      <div className="w-full flex flex-row items-end justify-between pointer-events-auto">
        {/* Bottom Left: Iconic Waterworld Movie Logo */}
        <div id="hud-bottom-left-waterworld-logo" className="flex items-end pb-1">
          <WaterWorldLogo />
        </div>
      </div>
    </div>
  );
};

