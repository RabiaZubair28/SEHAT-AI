import { Component, ErrorInfo, ReactNode } from "react";
import { Alert } from "antd";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Keeps an AI Nutrition Advisor failure inside its own tab, so the Nutrition
 * form and record submission keep working.
 */
class AdvisorErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AI Nutrition Advisor failed:", error, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          type="warning"
          showIcon
          message="The AI Nutrition Advisor is unavailable right now"
          description="You can still submit the Nutrition record from the Counseling tab."
        />
      );
    }
    return this.props.children;
  }
}

export default AdvisorErrorBoundary;
