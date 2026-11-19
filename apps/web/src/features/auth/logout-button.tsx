"use client";

import { useState } from "react";
import type { ReactElement } from "react";

export function LogoutButton(): ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  async function logout(): Promise<void> {
    setIsSubmitting(true);
    setHasError(false);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.status === 204) {
        window.location.replace("/login");
        return;
      }
      setHasError(true);
    } catch {
      setHasError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => void logout()}
      >
        {isSubmitting ? "Đang đăng xuất…" : "Đăng xuất"}
      </button>
      {hasError && (
        <p role="alert" className="auth-error">
          Đăng xuất chưa thành công. Thử lại nhé.
        </p>
      )}
    </div>
  );
}
