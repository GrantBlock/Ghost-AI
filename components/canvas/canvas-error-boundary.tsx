"use client";

import { TriangleAlert } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches Liveblocks connection/auth failures thrown by suspense hooks. */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex h-full flex-col items-center justify-center gap-2 bg-base px-6 text-center"
        >
          <TriangleAlert className="h-6 w-6 text-copy-faint" />
          <p className="text-sm font-medium text-copy-secondary">
            Couldn&apos;t connect to the canvas
          </p>
          <p className="text-xs text-copy-muted">
            Check your connection and refresh the page to try again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
