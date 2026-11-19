import type { Metadata } from "next";
import type { ReactElement } from "react";
import { LoginForm } from "../../features/auth/login-form.tsx";

export const metadata: Metadata = { title: "Đăng nhập · Social Media" };

export default function LoginPage(): ReactElement {
  return (
    <div className="app-shell">
      <header className="app-header">Social Media</header>
      <main className="login-main">
        <section className="connection-card" aria-labelledby="login-heading">
          <h1 id="login-heading">Đăng nhập</h1>
          <LoginForm />
        </section>
      </main>
    </div>
  );
}
