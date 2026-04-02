"use client";

import { useEffect, useState } from "react";

/**
 * Returns the device's compass heading in degrees (0 = North, 90 = East, etc.)
 * Uses `webkitCompassHeading` on iOS Safari, and `deviceorientationabsolute`
 * (falling back to `deviceorientation`) on Android/other browsers.
 * Returns null if the browser doesn't support orientation events.
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
      if (event.absolute && event.alpha != null && Number.isFinite(event.alpha)) {
        setHeading((360 - event.alpha) % 360);
      }
    }

    // Prefer absolute orientation (Chrome 66+) so alpha is relative to magnetic north
    const supportsAbsolute = "ondeviceorientationabsolute" in window;
    const eventName = supportsAbsolute ? "deviceorientationabsolute" : "deviceorientation";

    window.addEventListener(eventName, handleOrientation as EventListener);
    return () => window.removeEventListener(eventName, handleOrientation as EventListener);
  }, []);

  return heading;
}
