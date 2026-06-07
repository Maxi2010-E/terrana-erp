"use client";

const DEFAULT_TIMEOUT_MS = 15000;

export type ClientGeoPosition = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};

export function requestClientGeoPosition(): Promise<ClientGeoPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not supported on this device."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracyMeters: position.coords.accuracy ?? null,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(
            new Error(
              "Location access is required to sign in at the Terrana facility. Allow location in your browser and try again.",
            ),
          );
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new Error("Location request timed out. Try again near a window."));
          return;
        }
        reject(new Error("Could not read your location. Check GPS or Wi‑Fi and try again."));
      },
      {
        enableHighAccuracy: true,
        timeout: DEFAULT_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  });
}
