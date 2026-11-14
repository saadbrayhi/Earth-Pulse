"use client";

import { Component, type ReactNode } from "react";
import { MapStatus } from "./map-status";

export class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <MapStatus error title="The map could not start" detail="Reload the viewer to initialize a fresh map instance." onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
