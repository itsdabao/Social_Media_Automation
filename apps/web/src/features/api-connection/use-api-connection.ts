"use client";

import { useEffect, useState } from "react";
import { requestApiHealth } from "./request-api-health.ts";

export type ApiConnectionStatus = "checking" | "connected" | "error";

interface ApiConnectionState {
  readonly status: ApiConnectionStatus;
  readonly checkAgain: () => void;
}

export function useApiConnection(): ApiConnectionState {
  const [status, setStatus] = useState<ApiConnectionStatus>("checking");
  const [attemptNumber, setAttemptNumber] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function checkConnection(): Promise<void> {
      // An older or unmounted request must not overwrite the current check.
      try {
        await requestApiHealth(controller.signal);
        if (!controller.signal.aborted) {
          setStatus("connected");
        }
      } catch {
        if (!controller.signal.aborted) {
          setStatus("error");
        }
      }
    }

    void checkConnection();
    return () => controller.abort();
  }, [attemptNumber]);

  function checkAgain(): void {
    setStatus("checking");
    setAttemptNumber((previousAttempt) => previousAttempt + 1);
  }

  return { status, checkAgain };
}
