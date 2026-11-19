"use client";

import { useState } from "react";
import type { FormEvent, ReactElement } from "react";

export function LoginForm(): ReactElement {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      if (response.ok) {
        window.location.replace("/");
        return;
      }

      setError(
        response.status === 401
          ? "Email hoặc mật khẩu chưa đúng."
          : "Không thể đăng nhập. Thử lại sau nhé.",
      );
    } catch {
      setError("Không thể kết nối. Thử lại sau nhé.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        maxLength={254}
        required
      />
      <label htmlFor="password">Mật khẩu</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        maxLength={1024}
        required
      />
      {error && (
        <p role="alert" className="auth-error">
          {error}
        </p>
      )}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
