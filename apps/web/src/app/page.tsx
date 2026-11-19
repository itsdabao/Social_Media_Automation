import { SESSION_COOKIE_NAME } from "@social-media/contracts/auth";
import { cookies } from "next/headers.js";
import { redirect } from "next/navigation.js";
import type { ReactElement } from "react";
import { ApiConnectionPanel } from "../features/api-connection/api-connection-panel.tsx";
import { LogoutButton } from "../features/auth/logout-button.tsx";
import { readCurrentUser } from "../features/auth/server/auth-api.ts";

export default async function HomePage(): Promise<ReactElement> {
  const cookieStore = await cookies();
  const currentUser = await readCurrentUser(
    cookieStore.get(SESSION_COOKIE_NAME)?.value,
  );
  if (currentUser.status === "unauthenticated") {
    redirect("/login");
  }

  return (
    <div className="app-shell">
      <header className="app-header">Social Media</header>
      <main>
        {currentUser.status === "authenticated" ? (
          <section
            className="session-panel"
            aria-label="Tài khoản đang đăng nhập"
          >
            <p>{currentUser.user.email}</p>
            <LogoutButton />
          </section>
        ) : (
          <section className="session-panel" aria-label="Trạng thái đăng nhập">
            <p>Chưa kiểm tra được phiên đăng nhập.</p>
            <a href="/login">Về trang đăng nhập</a>
          </section>
        )}
        <h1>Kết nối API</h1>
        <ApiConnectionPanel />
      </main>
    </div>
  );
}
