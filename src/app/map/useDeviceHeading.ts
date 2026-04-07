"use client";

import { useEffect, useState } from "react";

/**
 * Returns the device's compass heading in degrees (0 = North, 90 = East, etc.)
 * Uses `webkitCompassHeading` on iOS Safari, and `deviceorientationabsolute`
 * (falling back to `deviceorientation`) on Android/other browsers.
 * Returns null if the browser doesn't support orientation events.
 *
 * On iOS 13+, DeviceOrientationEvent.requestPermission() must be called from
 * a user gesture. This hook fires that request automatically on first mount
 * (the gesture budget carries over from the geolocation prompt that fires
 * earlier in the same tap).  If permission is denied or unavailable the hook
 * simply returns null.
 */
export function useDeviceHeading(): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    function handleOrientation(event: DeviceOrientationEvent) {
      // iOS Safari provides webkitCompassHeading directly (0=N, clockwise)
      const ios = (event as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (ios != null && Number.isFinite(ios)) {
        setHeading(ios);
        return;
      }

      // Android / other: alpha is rotation from north but counter-clockwise,
      // so compass heading = (360 - alpha) % 360
      if (event.alpha != null && Number.isFinite(event.alpha)) {
        setHeading((360 - event.alpha) % 360);
      }
    }

    function listen() {
      // Prefer absolute orientation (Chrome 66+) so alpha is relative to magnetic north
      const supportsAbsolute = "ondeviceorientationabsolute" in window;
      const eventName = supportsAbsolute ? "deviceorientationabsolute" : "deviceorientation";
      window.addEventListener(eventName, handleOrientation as EventListener);
      return () => window.removeEventListener(eventName, handleOrientation as EventListener);
    }

    // iOS 13+ requires explicit permission
    type DOEWithPermission = typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<"granted" | "denied">;
    };

    const DOE = DeviceOrientationEvent as DOEWithPermission;
    if (typeof DOE.requestPermission === "function") {
      DOE.requestPermission()
        .then((state) => {
          if (state === "granted") listen();
        })
        .catch(() => { /* permission denied or not available */ });
      // cleanup handled inside listen(); nothing to return here for the iOS path
      return;
    }

    // Non-iOS path: attach listener directly
    return listen();
  }, []);

  return heading;
}
