import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FollowUpDecisionState {
  [patientId: string]: "new_visit" | "follow_up" | null;
}

const STORAGE_KEY = "followUpDecision_session";

// Load from sessionStorage
const loadState = (): FollowUpDecisionState => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (err) {
    console.error("Error loading follow-up decision:", err);
  }
  return {};
};

// Save to sessionStorage
const saveState = (state: FollowUpDecisionState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Error saving follow-up decision:", err);
  }
};

// Initial Load
const initialState: FollowUpDecisionState = loadState();

const followUpDecisionSlice = createSlice({
  name: "followUpDecision",
  initialState,
  reducers: {
    setFollowUpDecision: (
      state,
      action: PayloadAction<{
        patientId: string | number;
        decision: "new_visit" | "follow_up";
      }>
    ) => {
      const { patientId, decision } = action.payload;
      state[patientId] = decision;
      saveState(state);
    },

    clearFollowUpDecision: (
      state,
      action: PayloadAction<{ patientId: string | number }>
    ) => {
      const { patientId } = action.payload;
      delete state[patientId];
      saveState(state);
    },

    clearAllFollowUpDecisions: (state) => {
      Object.keys(state).forEach((k) => delete state[k]);
      saveState(state);
    },
  },
});

export const {
  setFollowUpDecision,
  clearFollowUpDecision,
  clearAllFollowUpDecisions,
} = followUpDecisionSlice.actions;

export default followUpDecisionSlice.reducer;
