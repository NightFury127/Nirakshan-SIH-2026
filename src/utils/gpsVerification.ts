/**
 * Nirakshan SIH 2026 — GPS Geofence & Haversine Distance Verification Engine
 * 
 * Computes exact spherical distance between Inspector physical coordinates
 * and the registered Project reference location using the Haversine formula.
 */

export interface GpsVerificationParams {
  inspectorLat: number;
  inspectorLng: number;
  projectLat: number;
  projectLng: number;
  accuracy?: number; // GPS accuracy in meters from device
  allowedRadius?: number; // Allowed geofence radius in meters (default: 100m)
}

export interface GpsVerificationResult {
  verified: boolean;
  distance: number; // Distance in meters (rounded)
  allowedRadius: number; // In meters
  inspectorLat: number;
  inspectorLng: number;
  projectLat: number;
  projectLng: number;
  accuracy?: number;
  timestamp: string;
  status: 'VERIFIED' | 'FAILED' | 'PENDING';
  message: string;
}

/**
 * Calculates Great-Circle distance between two coordinates in METERS
 * using the Haversine formula.
 * Earth Radius R = 6,371,000 meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Verifies if the inspector is physically within the registered project geofence.
 * Default allowed radius is 100 meters.
 */
export function verifyInspectorLocation({
  inspectorLat,
  inspectorLng,
  projectLat,
  projectLng,
  accuracy,
  allowedRadius = 100,
}: GpsVerificationParams): GpsVerificationResult {
  const distance = calculateHaversineDistance(
    inspectorLat,
    inspectorLng,
    projectLat,
    projectLng
  );

  const verified = distance <= allowedRadius;
  const now = new Date().toISOString();

  let message = '';
  if (verified) {
    message = `Location verified! You are ${distance}m from the registered project site (within ${allowedRadius}m geofence).`;
  } else {
    message = `GPS Verification Failed: You are ${distance}m away from the project site. Allowed radius is ${allowedRadius}m.`;
  }

  return {
    verified,
    distance,
    allowedRadius,
    inspectorLat: Number(inspectorLat.toFixed(6)),
    inspectorLng: Number(inspectorLng.toFixed(6)),
    projectLat: Number(projectLat.toFixed(6)),
    projectLng: Number(projectLng.toFixed(6)),
    accuracy: accuracy ? Math.round(accuracy) : undefined,
    timestamp: now,
    status: verified ? 'VERIFIED' : 'FAILED',
    message,
  };
}

/**
 * Format distance for clean UI display (e.g., "42 m" or "1.4 km")
 */
export function formatGpsDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}
