import React from "react";

type ErrorBoundaryProps = React.PropsWithChildren<{
  fallback?: React.ReactNode;
}>;

type ErrorBoundaryState = { hasError: boolean };

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(err: unknown, info: unknown) {
    console.error("UI Error:", err, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{ padding: 12 }}>Dieser Bereich ist gerade nicht verf�gbar.</div>
      );
    }
    return this.props.children ?? null;
  }
}
