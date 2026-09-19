import React from 'react';

interface GlassesFrameProps {
  children: React.ReactNode;
  displayMode: 'glasses' | 'fullscreen';
  onSwipe: (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  onSelect: () => void;
}

export const GlassesFrame: React.FC<GlassesFrameProps> = ({
  children,
  displayMode,
  onSwipe,
  onSelect,
}) => {
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to primary click / primary touch
    if (e.button !== 0) return;
    touchStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    const minDistance = 35; // px
    const maxTime = 700; // ms

    if (dt < maxTime) {
      if (Math.abs(dx) > minDistance || Math.abs(dy) > minDistance) {
        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx < 0) {
            onSwipe('LEFT');
          } else {
            onSwipe('RIGHT');
          }
        } else {
          // Vertical swipe
          if (dy < 0) {
            onSwipe('UP');
          } else {
            onSwipe('DOWN');
          }
        }
      } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
        // Tap / Select
        onSelect();
      }
    }
    touchStartRef.current = null;
  };

  if (displayMode === 'fullscreen') {
    return (
      <div
        id="glasses-viewport-fullscreen"
        className="relative w-screen h-screen overflow-hidden bg-black select-none"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      id="glasses-simulator-canvas"
      className="relative w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-2 sm:p-6 overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Glasses Frame Bezel Simulation */}
      <div className="relative flex flex-col items-center">
        {/* Top Eyewear Rim Indicator */}
        <div className="flex items-center gap-3 mb-2 px-4 py-1 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Meta Ray-Ban Display &bull; 600&times;600 Waveguide HUD</span>
        </div>

        {/* The 600x600 Glasses HUD Display Area */}
        <div
          id="glasses-viewport-600"
          className="relative w-[360px] h-[360px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] rounded-3xl overflow-hidden border-4 border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(14,165,233,0.15)] bg-black"
        >
          {children}

          {/* Waveguide lens tint and subtle inner glow */}
          <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-white/15" />
        </div>
      </div>
    </div>
  );
};
