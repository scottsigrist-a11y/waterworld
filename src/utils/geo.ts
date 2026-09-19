import * as turf from '@turf/turf';
import { LatLng, PathPoint, FloodedArea } from '../types';

export const SQ_METERS_PER_SQ_MILE = 2589988.110336;

/**
 * Calculates straight line distance in miles between two coordinates.
 */
export function getDistanceMiles(p1: LatLng, p2: LatLng): number {
  const from = turf.point([p1.lng, p1.lat]);
  const to = turf.point([p2.lng, p2.lat]);
  return turf.distance(from, to, { units: 'miles' });
}

/**
 * Computes destination point given an origin, distance in miles, and bearing in degrees.
 */
export function getDestinationPoint(origin: LatLng, distanceMiles: number, bearingDegrees: number): LatLng {
  const pt = turf.point([origin.lng, origin.lat]);
  const dest = turf.destination(pt, distanceMiles, bearingDegrees, { units: 'miles' });
  const [lng, lat] = dest.geometry.coordinates;
  return { lat, lng };
}

/**
 * Computes compass heading (0 = North, 90 = East, 180 = South, 270 = West) from p1 to p2.
 */
export function getHeading(p1: LatLng, p2: LatLng): number {
  const from = turf.point([p1.lng, p1.lat]);
  const to = turf.point([p2.lng, p2.lat]);
  const bearing = turf.bearing(from, to);
  return (bearing + 360) % 360;
}

/**
 * Calculates total path length in miles and updates cumulative distance on each point.
 */
export function buildPathWithDistances(points: LatLng[]): PathPoint[] {
  if (points.length === 0) return [];
  const result: PathPoint[] = [
    { ...points[0], distanceFromStart: 0, timestamp: Date.now() }
  ];

  let cumulative = 0;
  for (let i = 1; i < points.length; i++) {
    const d = getDistanceMiles(points[i - 1], points[i]);
    cumulative += d;
    result.push({
      ...points[i],
      distanceFromStart: cumulative,
      timestamp: Date.now()
    });
  }
  return result;
}

/**
 * Interpolates a position and heading along the path at a given distance from start.
 */
export function getPositionAtDistance(
  path: PathPoint[],
  targetDistance: number
): { lat: number; lng: number; heading: number; segmentIndex: number } {
  if (path.length === 0) {
    return { lat: 0, lng: 0, heading: 0, segmentIndex: 0 };
  }
  if (path.length === 1 || targetDistance <= 0) {
    const heading = path.length > 1 ? getHeading(path[0], path[1]) : 0;
    return { lat: path[0].lat, lng: path[0].lng, heading, segmentIndex: 0 };
  }

  const totalLength = path[path.length - 1].distanceFromStart;
  if (targetDistance >= totalLength) {
    const lastIdx = path.length - 1;
    const heading = getHeading(path[lastIdx - 1], path[lastIdx]);
    return { lat: path[lastIdx].lat, lng: path[lastIdx].lng, heading, segmentIndex: lastIdx - 1 };
  }

  // Find the segment containing targetDistance
  for (let i = 0; i < path.length - 1; i++) {
    const startPt = path[i];
    const endPt = path[i + 1];

    if (targetDistance >= startPt.distanceFromStart && targetDistance <= endPt.distanceFromStart) {
      const segLen = endPt.distanceFromStart - startPt.distanceFromStart;
      const ratio = segLen > 0 ? (targetDistance - startPt.distanceFromStart) / segLen : 0;

      const lat = startPt.lat + (endPt.lat - startPt.lat) * ratio;
      const lng = startPt.lng + (endPt.lng - startPt.lng) * ratio;
      const heading = getHeading(startPt, endPt);

      return { lat, lng, heading, segmentIndex: i };
    }
  }

  const last = path[path.length - 1];
  return { lat: last.lat, lng: last.lng, heading: 0, segmentIndex: path.length - 2 };
}

/**
 * Calculates the area in square miles of a polygon given as LatLng[].
 */
export function calculatePolygonAreaSqMiles(points: LatLng[]): number {
  if (points.length < 3) return 0;

  try {
    const coords = points.map((p) => [p.lng, p.lat]);
    // Ensure ring is closed
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push([coords[0][0], coords[0][1]]);
    }
    if (coords.length < 4) return 0;

    const poly = turf.polygon([coords]);
    const sqMeters = turf.area(poly);
    return sqMeters / SQ_METERS_PER_SQ_MILE;
  } catch {
    return 0;
  }
}

/**
 * Calculates the net floodable area of a candidate polygon, subtracting any portion
 * that overlaps with already flooded areas.
 */
export function calculateNetFloodableArea(
  candidatePoints: LatLng[],
  floodedAreas: FloodedArea[]
): number {
  if (candidatePoints.length < 3) return 0;

  try {
    const candidateCoords = candidatePoints.map((p) => [p.lng, p.lat]);
    if (
      candidateCoords[0][0] !== candidateCoords[candidateCoords.length - 1][0] ||
      candidateCoords[0][1] !== candidateCoords[candidateCoords.length - 1][1]
    ) {
      candidateCoords.push([candidateCoords[0][0], candidateCoords[0][1]]);
    }
    if (candidateCoords.length < 4) return 0;

    const candidatePoly = turf.polygon([candidateCoords]);
    const grossSqMeters = turf.area(candidatePoly);
    const grossSqMiles = grossSqMeters / SQ_METERS_PER_SQ_MILE;

    if (floodedAreas.length === 0) {
      return grossSqMiles;
    }

    // Accumulate overlap with each flooded polygon
    let totalOverlapSqMiles = 0;
    for (const flooded of floodedAreas) {
      if (flooded.polygon.length < 3) continue;
      try {
        const floodCoords = flooded.polygon.map((p) => [p.lng, p.lat]);
        if (
          floodCoords[0][0] !== floodCoords[floodCoords.length - 1][0] ||
          floodCoords[0][1] !== floodCoords[floodCoords.length - 1][1]
        ) {
          floodCoords.push([floodCoords[0][0], floodCoords[0][1]]);
        }
        if (floodCoords.length < 4) continue;

        const floodPoly = turf.polygon([floodCoords]);
        const intersection = turf.intersect(turf.featureCollection([candidatePoly, floodPoly]));
        if (intersection) {
          const overlapMeters = turf.area(intersection);
          totalOverlapSqMiles += overlapMeters / SQ_METERS_PER_SQ_MILE;
        }
      } catch {
        // Continue gracefully on individual polygon topological errors
      }
    }

    return Math.max(0, grossSqMiles - totalOverlapSqMiles);
  } catch {
    return 0;
  }
}
