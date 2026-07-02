// Captures device geolocation + timestamp metadata for a capture event.
// Returns { timestamp, latitude, longitude, accuracy } — location fields null
// if permission denied or unavailable, so callers never block on it.

export function getCaptureMeta() {
  const timestamp = new Date().toISOString();
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve({ timestamp, latitude: null, longitude: null, accuracy: null });
      return;
    }
    let settled = false;
    const done = (meta) => {
      if (settled) return;
      settled = true;
      resolve(meta);
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => done({
        timestamp,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      () => done({ timestamp, latitude: null, longitude: null, accuracy: null }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
    // Safety timeout in case the browser never calls back
    setTimeout(() => done({ timestamp, latitude: null, longitude: null, accuracy: null }), 9000);
  });
}