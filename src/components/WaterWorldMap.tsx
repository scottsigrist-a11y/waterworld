import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng, PathPoint, SeagullState, FloodedArea, DroppedEgg } from '../types';

interface WaterWorldMapProps {
  userLocation: LatLng;
  path: PathPoint[];
  seagullState: SeagullState;
  floodedAreas: FloodedArea[];
  floodablePolygon: LatLng[];
  isFlooding: boolean;
  floodingLineActive: boolean;
  zoomLevel: number;
  onZoomChange: (newZoom: number) => void;
  droppedEgg?: DroppedEgg | null;
}

export const WaterWorldMap: React.FC<WaterWorldMapProps> = ({
  userLocation,
  path,
  seagullState,
  floodedAreas,
  floodablePolygon,
  isFlooding,
  floodingLineActive,
  zoomLevel,
  droppedEgg,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Layer references
  const userMarkerRef = useRef<L.Marker | null>(null);
  const pathBlackOutlineRef = useRef<L.Polyline | null>(null);
  const pathYellowLineRef = useRef<L.Polyline | null>(null);
  const seagullMarkerRef = useRef<L.Marker | null>(null);
  const eggMarkerRef = useRef<L.Marker | null>(null);
  const whiteLineToUserRef = useRef<L.Polyline | null>(null);
  const floodablePolygonRef = useRef<L.Polygon | null>(null);
  const floodedLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const circleTrackRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [userLocation.lat, userLocation.lng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false,
      dragging: false, // In MRBD glasses, navigation is locked to user center & dpad controls
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
    });

    // OpenStreetMap standard tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Create Layer Groups
    const floodedGroup = L.layerGroup().addTo(map);
    floodedLayerGroupRef.current = floodedGroup;

    // Path black outline (wide)
    const blackOutline = L.polyline([], {
      color: '#000000',
      weight: 10,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    pathBlackOutlineRef.current = blackOutline;

    // Path yellow inner line (bold)
    const yellowLine = L.polyline([], {
      color: '#FFE500',
      weight: 6,
      opacity: 1,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    pathYellowLineRef.current = yellowLine;

    // Floodable preview polygon
    const floodablePoly = L.polygon([], {
      color: '#00E5FF',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#00D2FF',
      fillOpacity: 0.22,
    }).addTo(map);
    floodablePolygonRef.current = floodablePoly;

    // Update white line:
    // In patrol mode: Seagull -> User location
    // In circle mode: Spot on path seagull was just at (takeoff point) -> Seagull -> Current User location
    const whiteLine = L.polyline([], {
      color: '#FFFFFF',
      weight: 3.5,
      opacity: 0.95,
      dashArray: '6, 6',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    whiteLineToUserRef.current = whiteLine;

    // Circle track guide in circle mode
    const circleTrack = L.circle([0, 0], {
      radius: 10,
      color: '#38BDF8',
      weight: 1.5,
      opacity: 0.5,
      dashArray: '4, 8',
      fill: false,
    }).addTo(map);
    circleTrackRef.current = circleTrack;

    // User Location Marker (Radar Pulse Glass Beacon)
    const userIcon = L.divIcon({
      className: 'user-radar-marker',
      html: `
        <div class="relative flex items-center justify-center" style="width: 36px; height: 36px;">
          <div class="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping"></div>
          <div class="absolute inset-1 rounded-full bg-cyan-500/50 animate-pulse"></div>
          <div class="relative w-5 h-5 rounded-full bg-yellow-300 border-2 border-black shadow-[0_0_12px_#00E5FF] flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-black"></div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
    }).addTo(map);
    userMarkerRef.current = userMarker;

    // Seagull Marker
    const seagullIcon = L.divIcon({
      className: 'seagull-flight-marker',
      html: getSeagullMarkerHtml(seagullState.heading),
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    const seagullMarker = L.marker([seagullState.lat, seagullState.lng], {
      icon: seagullIcon,
      zIndexOffset: 2000,
    }).addTo(map);
    seagullMarkerRef.current = seagullMarker;

    mapRef.current = map;

    return () => {
      if (eggMarkerRef.current) {
        eggMarkerRef.current.remove();
        eggMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update zoom
  useEffect(() => {
    if (!mapRef.current) return;
    if (mapRef.current.getZoom() !== zoomLevel) {
      mapRef.current.setZoom(zoomLevel, { animate: true });
    }
  }, [zoomLevel]);

  // Keep map centered on user's current location
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.panTo([userLocation.lat, userLocation.lng], {
      animate: true,
      duration: 0.5,
    });
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // Update path lines
  useEffect(() => {
    const latLngs = path.map((p) => [p.lat, p.lng] as [number, number]);
    if (pathBlackOutlineRef.current) {
      pathBlackOutlineRef.current.setLatLngs(latLngs);
    }
    if (pathYellowLineRef.current) {
      pathYellowLineRef.current.setLatLngs(latLngs);
    }
  }, [path]);

  // Update seagull position & rotation
  useEffect(() => {
    if (seagullMarkerRef.current) {
      seagullMarkerRef.current.setLatLng([seagullState.lat, seagullState.lng]);
      const icon = L.divIcon({
        className: 'seagull-flight-marker',
        html: getSeagullMarkerHtml(seagullState.heading),
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      });
      seagullMarkerRef.current.setIcon(icon);
    }
  }, [seagullState.lat, seagullState.lng, seagullState.heading]);

  // Update dropped egg marker on the path with animated drop and splash
  useEffect(() => {
    if (!mapRef.current) return;

    if (droppedEgg) {
      const eggIcon = L.divIcon({
        className: 'dropped-egg-marker',
        html: getEggMarkerHtml(),
        iconSize: [48, 54],
        iconAnchor: [24, 48],
      });

      if (!eggMarkerRef.current) {
        eggMarkerRef.current = L.marker([droppedEgg.lat, droppedEgg.lng], {
          icon: eggIcon,
          zIndexOffset: 1500,
        }).addTo(mapRef.current);
      } else {
        eggMarkerRef.current.setLatLng([droppedEgg.lat, droppedEgg.lng]);
        eggMarkerRef.current.setIcon(eggIcon);
      }
    } else {
      if (eggMarkerRef.current) {
        eggMarkerRef.current.remove();
        eggMarkerRef.current = null;
      }
    }
  }, [droppedEgg?.id, droppedEgg?.lat, droppedEgg?.lng]);

  // Update white line:
  // When seagull is patrolling: Seagull -> Current user location
  // When seagull is circling: Dropped egg on path -> Seagull -> Current user location
  useEffect(() => {
    if (!whiteLineToUserRef.current) return;

    if (seagullState.mode === 'circle' && (droppedEgg || seagullState.circleTakeoffPoint)) {
      const eggPoint = droppedEgg ? { lat: droppedEgg.lat, lng: droppedEgg.lng } : seagullState.circleTakeoffPoint!;
      // The line connects from the egg to the seagull and then to the user's current location
      whiteLineToUserRef.current.setLatLngs([
        [eggPoint.lat, eggPoint.lng],
        [seagullState.lat, seagullState.lng],
        [userLocation.lat, userLocation.lng],
      ]);
    } else {
      whiteLineToUserRef.current.setLatLngs([
        [seagullState.lat, seagullState.lng],
        [userLocation.lat, userLocation.lng],
      ]);
    }

    // Animate to vibrant glowing blue during flooding
    if (floodingLineActive) {
      whiteLineToUserRef.current.setStyle({
        color: '#00E5FF',
        weight: 6,
        opacity: 1.0,
        dashArray: undefined,
      });
    } else {
      whiteLineToUserRef.current.setStyle({
        color: '#FFFFFF',
        weight: 3.5,
        opacity: 0.95,
        dashArray: '6, 6',
      });
    }
  }, [seagullState, userLocation, floodingLineActive, droppedEgg]);

  // Update circle track guide in circle mode
  useEffect(() => {
    if (!circleTrackRef.current) return;

    if (seagullState.mode === 'circle' && seagullState.circleCenter) {
      const radiusMeters = seagullState.circleRadiusMiles * 1609.34;
      circleTrackRef.current.setLatLng([seagullState.circleCenter.lat, seagullState.circleCenter.lng]);
      circleTrackRef.current.setRadius(radiusMeters);
      circleTrackRef.current.setStyle({ opacity: 0.6 });
    } else {
      circleTrackRef.current.setStyle({ opacity: 0 });
    }
  }, [seagullState.mode, seagullState.circleCenter, seagullState.circleRadiusMiles]);

  // Update floodable area polygon preview
  useEffect(() => {
    if (!floodablePolygonRef.current) return;

    if (floodablePolygon.length >= 3) {
      const latLngs = floodablePolygon.map((p) => [p.lat, p.lng] as [number, number]);
      floodablePolygonRef.current.setLatLngs(latLngs);
      floodablePolygonRef.current.setStyle({
        fillOpacity: isFlooding ? 0.45 : 0.22,
        color: isFlooding ? '#00E5FF' : '#00D2FF',
      });
    } else {
      floodablePolygonRef.current.setLatLngs([]);
    }
  }, [floodablePolygon, isFlooding]);

  // Render flooded water areas with animated ocean waves
  useEffect(() => {
    if (!floodedLayerGroupRef.current) return;
    const group = floodedLayerGroupRef.current;
    group.clearLayers();

    floodedAreas.forEach((area) => {
      if (area.polygon.length < 3) return;
      const latLngs = area.polygon.map((p) => [p.lat, p.lng] as [number, number]);

      // Ocean water deep abyss background
      const abyssPoly = L.polygon(latLngs, {
        color: '#0369A1',
        weight: 1,
        fillColor: '#075985',
        fillOpacity: 0.78,
        className: 'ocean-abyss-layer',
      });

      // Ocean water surface waves: undulating blue ocean with light caustics
      const oceanPoly = L.polygon(latLngs, {
        color: '#38BDF8',
        weight: 2,
        fillColor: '#0284C7',
        fillOpacity: 0.55,
        className: 'animated-ocean-water',
      });

      // Coastline foam boundary & tidal surf breaker
      const foamOutline = L.polygon(latLngs, {
        color: '#E0F2FE',
        weight: 2.5,
        fill: false,
        dashArray: '10, 8',
        className: 'ocean-foam-line',
      });

      // Outer ripple breaker
      const outerRipple = L.polygon(latLngs, {
        color: '#00E5FF',
        weight: 1,
        fill: false,
        dashArray: '4, 12',
        className: 'ocean-ripple-line',
      });

      group.addLayer(abyssPoly);
      group.addLayer(oceanPoly);
      group.addLayer(foamOutline);
      group.addLayer(outerRipple);
    });
  }, [floodedAreas]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* SVG Definitions for Animated Ocean Water Wave Patterns */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          {/* Animated ocean wave ripple pattern */}
          <pattern
            id="oceanWavePattern"
            width="60"
            height="30"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(15)"
          >
            {/* Deep ocean tile */}
            <rect width="60" height="30" fill="#0369A1" fillOpacity="0.75" />
            {/* Wave crest 1 */}
            <path
              d="M 0 10 Q 15 4 30 10 T 60 10"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeOpacity="0.8"
              className="wave-drift-fast"
            />
            {/* Wave crest 2 */}
            <path
              d="M 0 22 Q 15 16 30 22 T 60 22"
              fill="none"
              stroke="#7DD3FC"
              strokeWidth="1.5"
              strokeOpacity="0.65"
              className="wave-drift-slow"
            />
            {/* Foam speckles */}
            <circle cx="15" cy="8" r="1" fill="#E0F2FE" fillOpacity="0.7" />
            <circle cx="45" cy="20" r="1.2" fill="#E0F2FE" fillOpacity="0.6" />
          </pattern>
        </defs>
      </svg>
    </div>
  );
};

function getSeagullMarkerHtml(heading: number): string {
  return `
    <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.1s linear;">
      <div style="position: absolute; width: 34px; height: 18px; border-radius: 9999px; background: rgba(0,0,0,0.35); filter: blur(3px); transform: translate(3px, 10px);"></div>
      <svg viewBox="0 0 100 100" width="44" height="44" style="overflow: visible; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.5));">
        <defs>
          <linearGradient id="gullGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="70%" stop-color="#E2E8F0" />
            <stop offset="100%" stop-color="#CBD5E1" />
          </linearGradient>
          <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="50%">
            <stop offset="0%" stop-color="#F8FAFC" />
            <stop offset="60%" stop-color="#94A3B8" />
            <stop offset="100%" stop-color="#1E293B" />
          </linearGradient>
        </defs>

        <!-- Tail -->
        <polygon points="46,66 50,82 54,66" fill="#CBD5E1" stroke="#64748B" stroke-width="0.8" />

        <!-- Left Flapping Wing -->
        <g class="wing-flap-left">
          <path d="M 47 48 C 36 44 18 36 4 40 C 12 50 28 56 46 54 Z" fill="url(#wingGrad)" stroke="#475569" stroke-width="0.8" />
          <path d="M 4 40 C 9 44 15 47 17 48 C 13 46 8 43 4 40 Z" fill="#0F172A" />
        </g>

        <!-- Right Flapping Wing -->
        <g class="wing-flap-right">
          <path d="M 53 48 C 64 44 82 36 96 40 C 88 50 72 56 54 54 Z" fill="url(#wingGrad)" stroke="#475569" stroke-width="0.8" />
          <path d="M 96 40 C 91 44 85 47 83 48 C 87 46 92 43 96 40 Z" fill="#0F172A" />
        </g>

        <!-- Body & Head -->
        <ellipse cx="50" cy="50" rx="6.5" ry="16" fill="url(#gullGrad)" stroke="#64748B" stroke-width="0.8" />
        <circle cx="50" cy="30" r="5" fill="#FFFFFF" stroke="#64748B" stroke-width="0.8" />

        <!-- Beak -->
        <polygon points="48,26 52,26 50,15" fill="#FBBF24" stroke="#D97706" stroke-width="0.6" />
        <circle cx="50" cy="20" r="1" fill="#DC2626" />

        <!-- Eyes -->
        <circle cx="47.5" cy="29" r="0.9" fill="#0F172A" />
        <circle cx="52.5" cy="29" r="0.9" fill="#0F172A" />
      </svg>
    </div>
  `;
}

function getEggMarkerHtml(): string {
  return `
    <div class="egg-marker-wrap">
      <!-- Water splash ripples that burst outward when the egg lands -->
      <div class="egg-splash-container">
        <div class="egg-splash-ripple-1"></div>
        <div class="egg-splash-ripple-2"></div>
        <div class="egg-splash-droplets">
          <span class="splash-drop" style="--tx: -14px; --ty: -18px;"></span>
          <span class="splash-drop" style="--tx: -20px; --ty: -8px;"></span>
          <span class="splash-drop" style="--tx: -8px; --ty: -22px;"></span>
          <span class="splash-drop" style="--tx: 8px; --ty: -22px;"></span>
          <span class="splash-drop" style="--tx: 18px; --ty: -10px;"></span>
          <span class="splash-drop" style="--tx: 14px; --ty: -18px;"></span>
        </div>
      </div>

      <!-- Ground contact shadow -->
      <div class="egg-ground-shadow"></div>

      <!-- Falling & Settling Egg -->
      <div class="egg-falling-body">
        <svg viewBox="0 0 32 40" class="egg-svg-body" style="overflow: visible;">
          <defs>
            <radialGradient id="eggGrad" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stop-color="#FFFFFF" />
              <stop offset="30%" stop-color="#E0F7FA" />
              <stop offset="65%" stop-color="#38BDF8" />
              <stop offset="100%" stop-color="#0369A1" />
            </radialGradient>
            <linearGradient id="eggSheen" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.2" />
              <stop offset="100%" stop-color="#38BDF8" stop-opacity="0" />
            </linearGradient>
          </defs>

          <!-- Egg body shape -->
          <path
            d="M 16 2 C 24 2, 30 16, 30 26 C 30 34, 24 39, 16 39 C 8 39, 2 34, 2 26 C 2 16, 8 2, 16 2 Z"
            fill="url(#eggGrad)"
            stroke="#075985"
            stroke-width="1.6"
          />

          <!-- Glossy top reflection -->
          <path
            d="M 16 4 C 21 4, 25 14, 25 22 C 23 18, 19 10, 16 7 C 14 10, 10 17, 8 21 C 8 14, 11 4, 16 4 Z"
            fill="url(#eggSheen)"
          />

          <!-- Oceanic Seagull Egg Spots / Speckles -->
          <circle cx="10" cy="18" r="1.3" fill="#0C4A6E" opacity="0.65" />
          <circle cx="21" cy="21" r="1.1" fill="#0C4A6E" opacity="0.55" />
          <circle cx="15" cy="27" r="1.6" fill="#0369A1" opacity="0.75" />
          <circle cx="18" cy="13" r="0.9" fill="#075985" opacity="0.6" />
          <circle cx="12" cy="32" r="1.2" fill="#0C4A6E" opacity="0.5" />
          <circle cx="22" cy="30" r="1.4" fill="#075985" opacity="0.6" />

          <!-- Bright glint sparkle on egg tip -->
          <circle cx="13" cy="8" r="1.2" fill="#FFFFFF" opacity="0.95" />
        </svg>
      </div>
    </div>
  `;
}
