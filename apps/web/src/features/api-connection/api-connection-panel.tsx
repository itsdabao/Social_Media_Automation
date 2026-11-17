"use client";

import type { ReactElement } from "react";
import { useApiConnection } from "./use-api-connection.ts";
import type { ApiConnectionStatus } from "./use-api-connection.ts";

const CONNECTION_STATUS_LABELS: Readonly<Record<ApiConnectionStatus, string>> =
  {
    checking: "Đang kiểm tra kết nối…",
    connected: "Đã kết nối API",
    error: "Không thể kết nối API",
  };

export function ApiConnectionPanel(): ReactElement {
  const { status, checkAgain } = useApiConnection();

  return (
    <section className="connection-card" aria-labelledby="connection-heading">
      <div
        className="connection-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span
          className={`status-indicator status-indicator--${status}`}
          aria-hidden="true"
        />
        <h2 id="connection-heading">{CONNECTION_STATUS_LABELS[status]}</h2>
        {status === "error" && <p>Hãy kiểm tra API đang chạy rồi thử lại.</p>}
      </div>
      <button
        type="button"
        onClick={checkAgain}
        disabled={status === "checking"}
      >
        {status === "checking" ? "Đang kiểm tra…" : "Kiểm tra lại"}
      </button>
    </section>
  );
}
