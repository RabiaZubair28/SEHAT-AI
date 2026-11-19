import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Route } from "@/data/types";

// Define the type for RouteDefinition
type RouteDefinition = {
  route: string;
  method: string;
};

// Define the initial state type for the routes slice as an object
type RoutesState = Record<string, RouteDefinition>;

// Initialize an empty state
const initialState: RoutesState = {};

// Create the slice
const routesSlice = createSlice({
  name: "routes",
  initialState,
  reducers: {
    // Action to set routes in the state
    setRoutes(state, action: PayloadAction<Route[]>) {
      action.payload.forEach((r) => {
        if (r.name && r.method) {
          state[r.name] = { route: r.route, method: r.method };
        }
      });
    },
  },
});

// Export the setRoutes action and the reducer
export const { setRoutes } = routesSlice.actions;
export default routesSlice.reducer;
