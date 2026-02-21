import React from "react";
import ReactDOM from "react-dom/client";
import App from "../sir.app.jsx";
import "./index.css";

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep this visible in console for debugging while showing a UI fallback.
    console.error("SkateFlow runtime crash:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", background: "#0b1020", color: "#fff", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>SkateFlow hit an error</h1>
          <p style={{ opacity: 0.85, marginBottom: "12px" }}>Copy this message and send it here so I can fix it quickly.</p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "12px",
              padding: "12px",
              overflowX: "auto",
            }}
          >
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  // Beta mode: keep SW fully disabled to prevent stale-cached bundles.
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (k.startsWith("skateflow-cache-")) caches.delete(k);
        });
      });
    }
  });
}
