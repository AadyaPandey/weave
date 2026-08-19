import React from "react";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";
import EditorPage from "./pages/EditorPage";
import "./styles.css";
import "@xyflow/react/dist/style.css";

class EditorErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) return <main className="startup-error"><div className="eyebrow">WEAVE COULDN'T START</div><h1>Something needs attention</h1><p>{this.state.error.message || "An unexpected rendering error occurred."}</p><button onClick={() => window.location.reload()}>Reload editor</button></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <EditorErrorBoundary><ReactFlowProvider><EditorPage /></ReactFlowProvider></EditorErrorBoundary>
);
