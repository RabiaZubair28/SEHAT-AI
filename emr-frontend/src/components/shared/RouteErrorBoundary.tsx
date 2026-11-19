import { useEffect } from "react";
import { useRouteError } from "react-router-dom";
import ErrorFallback from "@/components/shared/ErrorFallback";
import Loader from "@/components/shared/Loader";
import {
  isChunkLoadError,
  isReloadInFlight,
  markAndReload,
  shouldAutoReload,
} from "@/utils/staleChunkReload";

const RouteErrorBoundary = () => {
  const error = useRouteError();

  useEffect(() => {
    console.error("Route error boundary caught:", error);
    if (shouldAutoReload(error)) markAndReload();
  }, [error]);

  const showLoader =
    isChunkLoadError(error) && (isReloadInFlight() || shouldAutoReload(error));

  if (showLoader) return <Loader />;

  return (
    <ErrorFallback
      onRetry={() => window.location.reload()}
      onGoHome={() => window.location.assign("/")}
    />
  );
};

export default RouteErrorBoundary;
