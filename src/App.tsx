import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LatLng, PathPoint, SeagullState, FloodedArea, DroppedEgg } from './types';
import {
  getDistanceMiles,
  getDestinationPoint,
  getHeading,
  buildPathWithDistances,
  getPositionAtDistance,
  calculateNetFloodableArea,
} from './utils/geo';
import { WaterWorldMap } from './components/WaterWorldMap';
import { HUDOverlay } from './components/HUDOverlay';
import { GlassesFrame } from './components/GlassesFrame';

// Default initial location: San Francisco waterfront / Marina Green
const INITIAL_LOCATION: LatLng = {
  lat: 37.805,
  lng: -122.44,
};

// Default seed path forming an interesting scenic coastal loop
function generateSeedPath(center: LatLng): LatLng[] {
  return [
    { lat: center.lat - 0.006, lng: center.lng - 0.009 },
    { lat: center.lat - 0.003, lng: center.lng - 0.012 },
    { lat: center.lat + 0.002, lng: center.lng - 0.011 },
    { lat: center.lat + 0.005, lng: center.lng - 0.006 },
    { lat: center.lat + 0.004, lng: center.lng + 0.001 },
    { lat: center.lat + 0.001, lng: center.lng + 0.005 },
    { lat: center.lat, lng: center.lng },
  ];
}

export default function App() {
  const [userLocation, setUserLocation] = useState<LatLng>(INITIAL_LOCATION);
  const [path, setPath] = useState<PathPoint[]>(() =>
    buildPathWithDistances(generateSeedPath(INITIAL_LOCATION))
  );

  const [score, setScore] = useState<number>(0);
  const [floodableArea, setFloodableArea] = useState<number>(0);
  const [floodablePolygon, setFloodablePolygon] = useState<LatLng[]>([]);
  const [floodedAreas, setFloodedAreas] = useState<FloodedArea[]>([]);

  const [isFlooding, setIsFlooding] = useState<boolean>(false);
  const [floodingLineActive, setFloodingLineActive] = useState<boolean>(false);

  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [displayMode, setDisplayMode] = useState<'glasses' | 'fullscreen'>(() => {
    // Check URL parameters for explicit mode, e.g. ?mode=glasses or ?mode=fullscreen
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'glasses' || modeParam === 'fullscreen') {
        return modeParam;
      }
    }
    return 'fullscreen';
  });
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [gpsActive, setGpsActive] = useState<boolean>(false);

  // Seagull State
  const [seagullState, setSeagullState] = useState<SeagullState>({
    lat: INITIAL_LOCATION.lat,
    lng: INITIAL_LOCATION.lng,
    heading: 0,
    progress: 0,
    direction: 'forward',
    mode: 'patrol',
    circleStartTime: null,
    circleTakeoffPoint: null,
    circleCenter: null,
    circleRadiusMiles: 0.25,
  });

  const [circleTimeRemaining, setCircleTimeRemaining] = useState<number>(0);
  const [droppedEgg, setDroppedEgg] = useState<DroppedEgg | null>(null);

  // References for animation loops and atomic state transitions
  const pathRef = useRef(path);
  pathRef.current = path;

  const userLocationRef = useRef(userLocation);
  userLocationRef.current = userLocation;

  const seagullRef = useRef(seagullState);
  seagullRef.current = seagullState;

  const isCirclingRef = useRef<boolean>(false);
  const droppedEggRef = useRef<DroppedEgg | null>(null);
  const takeoffProgressRef = useRef<number>(0);

  const floodedAreasRef = useRef(floodedAreas);
  floodedAreasRef.current = floodedAreas;

  const lastPatrolTickRef = useRef<number>(Date.now());
  const patrolElapsedRef = useRef<number>(0); // ms along the 30s traverse

  // Atomic helper to return the seagull immediately to the path and resume patrolling
  const returnToPath = useCallback(() => {
    isCirclingRef.current = false;
    const currentSeagull = seagullRef.current;
    const takeoff = currentSeagull.circleTakeoffPoint || droppedEggRef.current || userLocationRef.current;

    // Restore patrol progression so the seagull continues smoothly along the path from takeoff point
    patrolElapsedRef.current = takeoffProgressRef.current;

    const nextSeagullState: SeagullState = {
      ...currentSeagull,
      mode: 'patrol',
      lat: takeoff.lat,
      lng: takeoff.lng,
      circleStartTime: null,
      circleTakeoffPoint: null,
      circleCenter: null,
      circleInitialAngle: undefined,
      circleDirection: undefined,
    };

    seagullRef.current = nextSeagullState;
    setSeagullState(nextSeagullState);

    droppedEggRef.current = null;
    setDroppedEgg(null);
    setCircleTimeRemaining(0);
  }, []);

  // 1. Real GPS Tracking with multi-stage fallback
  useEffect(() => {
    if (!navigator.geolocation) return;

    let hasCentered = false;

    // First try a quick high-accuracy fetch
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!hasCentered) {
          hasCentered = true;
          setGpsActive(true);
          const initLoc: LatLng = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(initLoc);
          const seed = generateSeedPath(initLoc);
          setPath(buildPathWithDistances(seed));
        }
      },
      (err) => {
        console.warn('Initial high-accuracy GPS error, will rely on watchPosition:', err.message);
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsActive(true);
        const newLoc: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        if (!hasCentered) {
          hasCentered = true;
          setUserLocation(newLoc);
          const newSeed = generateSeedPath(newLoc);
          setPath(buildPathWithDistances(newSeed));
        } else {
          // If moved by at least 3 meters (~0.0018 miles)
          const lastLoc = userLocationRef.current;
          const dist = getDistanceMiles(lastLoc, newLoc);
          if (dist > 0.002) {
            setUserLocation(newLoc);
            setPath((prev) => {
              const updated = [...prev, { ...newLoc, distanceFromStart: 0, timestamp: Date.now() }];
              return buildPathWithDistances(updated);
            });
          }
        }
      },
      (err) => {
        console.warn('Geolocation watch error:', err.message);
        // Do not crash or lock state; keep existing location active
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // 2. Simulated Walk Mode
  useEffect(() => {
    if (!isSimulating) return;

    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.06;
      const r = 0.0025; // radius in degrees
      const center = pathRef.current[0] || INITIAL_LOCATION;
      const newLoc: LatLng = {
        lat: center.lat + Math.sin(angle) * r * 1.5,
        lng: center.lng + Math.cos(angle) * r * 2.0,
      };

      setUserLocation(newLoc);
      setPath((prev) => {
        const updated = [...prev, { ...newLoc, distanceFromStart: 0, timestamp: Date.now() }];
        // Keep reasonable max length for smooth performance
        if (updated.length > 150) {
          updated.splice(1, 1);
        }
        return buildPathWithDistances(updated);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // 3. Seagull Flight Animation (Patrol & Circle Flight)
  useEffect(() => {
    let animFrame: number;

    const animateFlight = () => {
      const now = Date.now();
      const dt = now - lastPatrolTickRef.current;
      lastPatrolTickRef.current = now;

      const currentPath = pathRef.current;
      const totalDist = currentPath.length > 0 ? currentPath[currentPath.length - 1].distanceFromStart : 0;
      const currentSeagull = seagullRef.current;

      if (isCirclingRef.current) {
        // Circle mode: 30 seconds for 360-degree circle
        const circleStart = currentSeagull.circleStartTime || now;
        const elapsedCircleMs = now - circleStart;
        const remainingSec = Math.max(0, (30000 - elapsedCircleMs) / 1000);
        setCircleTimeRemaining(remainingSec);

        if (elapsedCircleMs >= 30000) {
          // Circle complete: return to path patrol at takeoff point
          returnToPath();
        } else {
          // Calculate circular flight coordinates starting smoothly from initialAngle (the egg location)
          const circleProgress = elapsedCircleMs / 30000; // 0 to 1
          const initialAngle = currentSeagull.circleInitialAngle ?? 270;
          const isCCW = currentSeagull.circleDirection === 'ccw';
          const currentAngleDeg = isCCW
            ? (initialAngle - circleProgress * 360 + 3600) % 360
            : (initialAngle + circleProgress * 360) % 360;
          const center = currentSeagull.circleCenter || userLocationRef.current;
          const radiusMiles = currentSeagull.circleRadiusMiles;

          const currentPoint = getDestinationPoint(center, radiusMiles, currentAngleDeg);
          // Tangent heading: for CW it's +90 deg; for CCW it's -90 deg to radius vector
          const heading = isCCW
            ? (currentAngleDeg - 90 + 360) % 360
            : (currentAngleDeg + 90) % 360;

          const nextState: SeagullState = {
            ...currentSeagull,
            lat: currentPoint.lat,
            lng: currentPoint.lng,
            heading,
            mode: 'circle',
          };
          seagullRef.current = nextState;
          setSeagullState(nextState);
        }
      } else {
        // Patrol mode: always takes 30 seconds (30,000 ms) from one end to the other
        patrolElapsedRef.current += dt;
        const cycle = 60000; // 30s forward + 30s backward
        const tCycle = patrolElapsedRef.current % cycle;

        let progress: number;
        let direction: 'forward' | 'backward';

        if (tCycle <= 30000) {
          progress = tCycle / 30000; // 0 -> 1
          direction = 'forward';
        } else {
          progress = (60000 - tCycle) / 30000; // 1 -> 0
          direction = 'backward';
        }

        const targetDist = progress * totalDist;
        const pos = getPositionAtDistance(currentPath, targetDist);
        // If flying backward, flip heading 180 degrees
        const effectiveHeading = direction === 'backward' ? (pos.heading + 180) % 360 : pos.heading;

        const nextState: SeagullState = {
          ...currentSeagull,
          lat: pos.lat,
          lng: pos.lng,
          heading: effectiveHeading,
          progress,
          direction,
          mode: 'patrol',
        };
        seagullRef.current = nextState;
        setSeagullState(nextState);
      }

      animFrame = requestAnimationFrame(animateFlight);
    };

    lastPatrolTickRef.current = Date.now();
    animFrame = requestAnimationFrame(animateFlight);

    return () => cancelAnimationFrame(animFrame);
  }, [returnToPath]);

  // 4. Calculate Floodable Area & Polygon in Real Time
  useEffect(() => {
    const currentPath = pathRef.current;
    const seagull = seagullState;
    const user = userLocation;

    if (currentPath.length < 2) {
      setFloodableArea(0);
      setFloodablePolygon([]);
      return;
    }

    let candidatePoly: LatLng[] = [];

    if (seagull.mode === 'circle' && (droppedEgg || seagull.circleTakeoffPoint)) {
      // When the seagull is circling, the white lines go from the egg on the path to the seagull,
      // and from the seagull to the current user location.
      // The polygon connects through the path from the egg to the user.
      const eggPoint = droppedEgg ? { lat: droppedEgg.lat, lng: droppedEgg.lng } : seagull.circleTakeoffPoint!;
      const eggIdx = currentPath.findIndex((p) => {
        const d = getDistanceMiles(p, eggPoint);
        return d < 0.05;
      });

      const pathFromEggToUser =
        eggIdx >= 0
          ? currentPath.slice(eggIdx).map((p) => ({ lat: p.lat, lng: p.lng }))
          : currentPath.map((p) => ({ lat: p.lat, lng: p.lng }));

      candidatePoly = [
        { lat: eggPoint.lat, lng: eggPoint.lng },
        { lat: seagull.lat, lng: seagull.lng },
        { lat: user.lat, lng: user.lng },
        ...pathFromEggToUser.reverse(),
      ];
    } else {
      // In patrol mode: the area is bounded by the path between the seagull's current position and user location,
      // and the white line from the seagull to the user.
      // We only include the segment of path between where the seagull is and where the user is,
      // rather than connecting to the start of the path!
      const seagullPt: LatLng = { lat: seagull.lat, lng: seagull.lng };
      const userPt: LatLng = { lat: user.lat, lng: user.lng };

      // Find the segment in currentPath from the seagull's position to the user
      // Seagull's distance from start along path:
      const totalLen = currentPath[currentPath.length - 1].distanceFromStart;
      const seagullDist = seagull.progress * totalLen;

      // Find path points between seagull and user (end of path)
      const subPathPoints = currentPath
        .filter((p) => p.distanceFromStart >= seagullDist)
        .map((p) => ({ lat: p.lat, lng: p.lng }));

      candidatePoly = [
        seagullPt,
        ...subPathPoints,
        userPt,
      ];
    }

    setFloodablePolygon(candidatePoly);

    // Compute net floodable area (subtracting area that is already water filled)
    const netArea = calculateNetFloodableArea(candidatePoly, floodedAreasRef.current);
    setFloodableArea(netArea);
  }, [seagullState.lat, seagullState.lng, userLocation, seagullState.mode, droppedEgg]);

  // Zoom distance calculation in miles across viewport
  const getApproxViewMiles = (zoom: number, lat: number): number => {
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const containerPx = 600;
    return (containerPx * 24901 * cosLat) / (256 * Math.pow(2, zoom));
  };

  const zoomMiles = getApproxViewMiles(zoomLevel, userLocation.lat);

  // Maximum 200 miles constraint for Zoom Out
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(18, prev + 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const nextZoom = prev - 1;
      const nextMiles = getApproxViewMiles(nextZoom, userLocation.lat);
      if (nextMiles > 200) {
        return prev; // Maximum 200 miles constraint
      }
      return Math.max(6, nextZoom);
    });
  }, [userLocation.lat]);

  // SWIPE LEFT: Flooding Action
  const triggerFlooding = useCallback(() => {
    if (floodableArea <= 0 && floodablePolygon.length < 3) {
      // Still show banner feedback for user responsiveness
      setIsFlooding(true);
      setTimeout(() => setIsFlooding(false), 1000);
      return;
    }

    // 1. Show "FLOODING" banner in center for 1 second
    setIsFlooding(true);
    setFloodingLineActive(true);

    // 2. Add to flooded areas and score
    const newFloodId = 'flood-' + Date.now();
    const newArea: FloodedArea = {
      id: newFloodId,
      polygon: [...floodablePolygon],
      addedAt: Date.now(),
      areaSqMiles: floodableArea,
      waveSeed: Math.random(),
    };

    setFloodedAreas((prev) => [...prev, newArea]);
    setScore((prev) => prev + floodableArea);

    // After an area gets flooded, the seagull returns to the path and continues
    if (isCirclingRef.current) {
      returnToPath();
    }

    setTimeout(() => {
      setIsFlooding(false);
      setFloodingLineActive(false);
    }, 1000);
  }, [floodableArea, floodablePolygon, returnToPath]);

  // SWIPE RIGHT: Seagull drops an egg on the path, then completes its circle.
  // - Randomly chooses clockwise or counter-clockwise.
  // - If the user swipes right while in a circle, the seagull returns immediately to the path and DOES NOT lay an egg.
  const triggerCircleFlight = useCallback(() => {
    // If the seagull is currently in circle flight or an egg exists, return immediately to the path
    if (isCirclingRef.current || seagullRef.current.mode === 'circle' || droppedEggRef.current !== null) {
      returnToPath();
      return;
    }

    const currentPath = pathRef.current;
    const totalLength = currentPath.length > 0 ? currentPath[currentPath.length - 1].distanceFromStart : 1.0;

    // Circle diameter = 5% of total path length, min = 0.25 miles, max = 5.0 miles
    const diameter = Math.min(5.0, Math.max(0.25, totalLength * 0.05));
    const radiusMiles = diameter / 2;

    const takeoffPoint: LatLng = { lat: seagullRef.current.lat, lng: seagullRef.current.lng };

    // Remember progress along path at takeoff so we can continue seamlessly when returning
    const currentProgress = seagullRef.current.progress ?? 0;
    const currentDirection = seagullRef.current.direction ?? 'forward';
    takeoffProgressRef.current =
      currentDirection === 'backward'
        ? 60000 - currentProgress * 30000
        : currentProgress * 30000;

    // Randomly clockwise or counter-clockwise
    const isClockwise = Math.random() < 0.5;
    const circleDirection: 'cw' | 'ccw' = isClockwise ? 'cw' : 'ccw';

    // Center calculation:
    // Clockwise turns right (heading + 90)
    // Counter-clockwise turns left (heading - 90)
    const centerBearing = isClockwise
      ? (seagullRef.current.heading + 90) % 360
      : (seagullRef.current.heading - 90 + 360) % 360;

    const centerPoint = getDestinationPoint(takeoffPoint, radiusMiles, centerBearing);
    // Initial angle from center back to takeoff point (so circle starts right at the egg)
    const initialAngle = (centerBearing + 180) % 360;

    // Drop egg onto the path
    const newEgg: DroppedEgg = {
      id: 'egg-' + Date.now(),
      lat: takeoffPoint.lat,
      lng: takeoffPoint.lng,
      droppedAt: Date.now(),
    };
    droppedEggRef.current = newEgg;
    setDroppedEgg(newEgg);

    isCirclingRef.current = true;

    const nextSeagullState: SeagullState = {
      ...seagullRef.current,
      mode: 'circle',
      circleStartTime: Date.now(),
      circleTakeoffPoint: takeoffPoint,
      circleCenter: centerPoint,
      circleRadiusMiles: radiusMiles,
      circleInitialAngle: initialAngle,
      circleDirection,
    };
    seagullRef.current = nextSeagullState;
    setSeagullState(nextSeagullState);
  }, [returnToPath]);

  // ENTER / SELECT Action: In circle flight or patrol, trigger flooding
  const handleSelect = useCallback(() => {
    triggerFlooding();
  }, [triggerFlooding]);

  // Master D-Pad & Swipe Handler
  const handleDpadAction = useCallback(
    (action: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SELECT') => {
      switch (action) {
        case 'UP':
          handleZoomIn();
          break;
        case 'DOWN':
          handleZoomOut();
          break;
        case 'LEFT':
          triggerFlooding();
          break;
        case 'RIGHT':
          triggerCircleFlight();
          break;
        case 'SELECT':
          handleSelect();
          break;
      }
    },
    [handleZoomIn, handleZoomOut, triggerFlooding, triggerCircleFlight, handleSelect]
  );

  // Keyboard & Glasses Input Listener (MRBD OS translation to Arrow keys, Media keys, Enter, and Gamepad)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const code = e.code;

      if (key === 'ArrowUp' || code === 'ArrowUp' || key === 'Up') {
        e.preventDefault();
        handleDpadAction('UP');
      } else if (key === 'ArrowDown' || code === 'ArrowDown' || key === 'Down') {
        e.preventDefault();
        handleDpadAction('DOWN');
      } else if (key === 'ArrowLeft' || code === 'ArrowLeft' || key === 'Left') {
        e.preventDefault();
        handleDpadAction('LEFT');
      } else if (key === 'ArrowRight' || code === 'ArrowRight' || key === 'Right') {
        e.preventDefault();
        handleDpadAction('RIGHT');
      } else if (
        key === 'Enter' ||
        key === ' ' ||
        key === 'Select' ||
        code === 'Enter' ||
        code === 'Space' ||
        code === 'NumpadEnter' ||
        key === 'MediaPlayPause' ||
        key === 'HeadsetHook'
      ) {
        e.preventDefault();
        handleDpadAction('SELECT');
      } else if (key === 'w' || key === 'W') {
        // Manual directional walk controls for testing
        setUserLocation((prev) => {
          const next = { lat: prev.lat + 0.0008, lng: prev.lng };
          setPath((p) => buildPathWithDistances([...p, { ...next, distanceFromStart: 0, timestamp: Date.now() }]));
          return next;
        });
      } else if (key === 's' || key === 'S') {
        setUserLocation((prev) => {
          const next = { lat: prev.lat - 0.0008, lng: prev.lng };
          setPath((p) => buildPathWithDistances([...p, { ...next, distanceFromStart: 0, timestamp: Date.now() }]));
          return next;
        });
      } else if (key === 'a' || key === 'A') {
        setUserLocation((prev) => {
          const next = { lat: prev.lat, lng: prev.lng - 0.001 };
          setPath((p) => buildPathWithDistances([...p, { ...next, distanceFromStart: 0, timestamp: Date.now() }]));
          return next;
        });
      } else if (key === 'd' || key === 'D') {
        setUserLocation((prev) => {
          const next = { lat: prev.lat, lng: prev.lng + 0.001 };
          setPath((p) => buildPathWithDistances([...p, { ...next, distanceFromStart: 0, timestamp: Date.now() }]));
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDpadAction]);

  const totalPathLength = path.length > 0 ? path[path.length - 1].distanceFromStart : 0;

  return (
    <GlassesFrame
      displayMode={displayMode}
      onSwipe={(dir) => handleDpadAction(dir)}
      onSelect={() => handleDpadAction('SELECT')}
    >
      <div className="relative w-full h-full overflow-hidden bg-slate-900 select-none">
        {/* Fullscreen OpenStreetMap layer */}
        <WaterWorldMap
          userLocation={userLocation}
          path={path}
          seagullState={seagullState}
          floodedAreas={floodedAreas}
          floodablePolygon={floodablePolygon}
          isFlooding={isFlooding}
          floodingLineActive={floodingLineActive}
          zoomLevel={zoomLevel}
          onZoomChange={(newZoom) => setZoomLevel(newZoom)}
          droppedEgg={droppedEgg}
        />

        {/* HUD Overlay with MRBD Typography and Controls */}
        <HUDOverlay
          score={score}
          floodableArea={floodableArea}
          isFlooding={isFlooding}
          flightMode={seagullState.mode}
          circleTimeRemaining={circleTimeRemaining}
          totalPathLength={totalPathLength}
          onTriggerDpad={handleDpadAction}
          zoomMiles={zoomMiles}
        />
      </div>
    </GlassesFrame>
  );
}
