import "antd/dist/reset.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/redux/store";
import "./index.css";
import App from "./App.tsx";
import { NotificationProvider } from "./hooks/useNotification.tsx";
import Loader from "./components/shared/Loader.tsx";
import AppErrorBoundary from "./components/shared/AppErrorBoundary.tsx";
import { markAndReload, shouldAutoReload } from "@/utils/staleChunkReload";

// After a deployment, old hashed chunks are deleted. A tab (or crawler) still on the previous index.html then fails to load them.
// Reload once to pick up the new build instead.
// Deliberately no preventDefault(): the original error must reach the route error boundary so it can recognize it.
window.addEventListener("vite:preloadError", (event) => {
  if (shouldAutoReload(event.payload)) markAndReload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<Loader />} persistor={persistor}>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </PersistGate>
      </Provider>
    </AppErrorBoundary>
  </StrictMode>
);
