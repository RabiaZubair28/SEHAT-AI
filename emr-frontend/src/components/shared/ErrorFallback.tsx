import { Result } from "antd";
import CustomButton from "@/components/ui/Button";

interface ErrorFallbackProps {
  onRetry: () => void;
  onGoHome: () => void;
}

const ErrorFallback = ({ onRetry, onGoHome }: ErrorFallbackProps) => {
  return (
    <Result
      status="500"
      title="Unexpected Error"
      subTitle="Something went wrong. Please try again."
      extra={
        <div className="flex justify-center gap-4">
          <CustomButton
            title="Try Again"
            variant="primary"
            onClick={onRetry}
          />
          <CustomButton
            title="Go Home"
            variant="secondary"
            onClick={onGoHome}
          />
        </div>
      }
    />
  );
};

export default ErrorFallback;
