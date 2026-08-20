import { useEffect, useState } from "react";

/**
 * Reports whether a microphone can be used in this browser.
 * Real speech recognition can reuse this hook unchanged — it only reads
 * capability/permission, never opens a stream.
 */
export function useMicAvailability() {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const supported =
      typeof navigator !== "undefined" &&
      typeof navigator.mediaDevices?.getUserMedia === "function";

    if (!supported) {
      setAvailable(false);
      return;
    }

    const permissions = navigator.permissions;
    if (!permissions?.query) return;

    permissions
      .query({ name: "microphone" as PermissionName })
      .then((status) => {
        if (cancelled) return;
        setAvailable(status.state !== "denied");
        status.onchange = () => setAvailable(status.state !== "denied");
      })
      .catch(() => {
        /* permission API unsupported for microphone — assume available */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return available;
}
