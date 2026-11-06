import { useEffect, useState } from "react";
import { isSpeechRecognitionSupported } from "@/services/speech/recognition";

export type MicStatus = {
  isSupported: boolean;
  isDenied: boolean;
  isAvailable: boolean;
};

/**
 * Hook providing comprehensive microphone status:
 * - isSupported: whether the browser implements Web Speech Recognition
 * - isDenied: whether microphone access is explicitly blocked via Permissions API
 * - isAvailable: true if supported and not denied
 * Never opens an unnecessary audio media stream.
 */
export function useMicStatus(): MicStatus {
  const [status, setStatus] = useState<MicStatus>(() => {
    const supported = isSpeechRecognitionSupported();
    return {
      isSupported: supported,
      isDenied: false,
      isAvailable: supported,
    };
  });

  useEffect(() => {
    let cancelled = false;
    const supported = isSpeechRecognitionSupported();

    if (!supported) {
      setStatus({ isSupported: false, isDenied: false, isAvailable: false });
      return;
    }

    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setStatus({ isSupported: true, isDenied: false, isAvailable: true });
      return;
    }

    try {
      navigator.permissions
        .query({ name: "microphone" as PermissionName })
        .then((perm) => {
          if (cancelled) return;
          const isDenied = perm.state === "denied";
          setStatus({
            isSupported: true,
            isDenied,
            isAvailable: !isDenied,
          });
          perm.onchange = () => {
            if (!cancelled) {
              const denied = perm.state === "denied";
              setStatus({
                isSupported: true,
                isDenied: denied,
                isAvailable: !denied,
              });
            }
          };
        })
        .catch(() => {
          if (!cancelled) {
            setStatus({ isSupported: true, isDenied: false, isAvailable: true });
          }
        });
    } catch {
      if (!cancelled) {
        setStatus({ isSupported: true, isDenied: false, isAvailable: true });
      }
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

/**
 * Legacy boolean convenience hook for backward compatibility.
 */
export function useMicAvailability(): boolean {
  const { isAvailable } = useMicStatus();
  return isAvailable;
}
