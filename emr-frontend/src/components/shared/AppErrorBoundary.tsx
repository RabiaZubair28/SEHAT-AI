import { Component, ErrorInfo, ReactNode } from "react";
import ErrorFallback from "@/components/shared/ErrorFallback";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App error boundary caught:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          onRetry={() => window.location.reload()}
          onGoHome={() => window.location.assign("/")}
        />
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
