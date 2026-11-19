import { setRoutes } from "@/redux/store/slices/routeSice";

// src/utils/loadRoutes.ts
import { store } from "@/redux/store";
import { routesApiService } from "@/services/routesApiService";

export const loadRoutes = async () => {
  try {
    const response = await store.dispatch(
      routesApiService.endpoints.getRoutes.initiate(undefined, {
        subscribe: false, // Don't maintain cache subscription
        forceRefetch: true, // Always get fresh data
      })
    );

    if (response.data) {
      store.dispatch(setRoutes(response.data));
    }

    return response.data;
  } catch (error) {
    // console.error("Failed to load routes:", error);
    throw error;
  }
};
