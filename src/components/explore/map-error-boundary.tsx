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
      return (
        <MapStatus
          error
          title="The map could not start"
          detail="Try starting a fresh map instance. Your layer settings will be preserved."
          onRetry={() => this.setState({ failed: false })}
        />
      );
    }
    return this.props.children;
  }
}
