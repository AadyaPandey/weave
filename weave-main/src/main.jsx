import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ReactFlowProvider } from "@xyflow/react";

import EditorPage from "./pages/EditorPage";
import LandingPage from "./LandingPage";

import "./styles.css";
import "@xyflow/react/dist/style.css";

class EditorErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="startup-error">
          <div className="eyebrow">WEAVE COULDN'T START</div>

          <h1>Something needs attention</h1>

          <p>
            {this.state.error.message ||
              "An unexpected rendering error occurred."}
          </p>

          <button onClick={() => window.location.reload()}>
            Reload editor
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

function Root() {
  const [showLanding, setShowLanding] = useState(true);

  if (showLanding) {
    return <LandingPage onComplete={() => setShowLanding(false)} />;
  }

  return (
    <EditorErrorBoundary>
      <ReactFlowProvider>
        <EditorPage />
      </ReactFlowProvider>
    </EditorErrorBoundary>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
