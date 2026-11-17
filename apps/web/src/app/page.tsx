import type { ReactElement } from "react";
import { ApiConnectionPanel } from "../features/api-connection/api-connection-panel.tsx";

export default function HomePage(): ReactElement {
  return (
    <div className="app-shell">
      <header className="app-header">Social Media</header>
      <main>
        <h1>Kết nối API</h1>
        <ApiConnectionPanel />
      </main>
    </div>
  );
}
