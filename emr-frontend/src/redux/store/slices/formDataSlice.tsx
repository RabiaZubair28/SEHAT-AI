import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface FormState {
  [formKey: string]: Record<string, any>; // { ancForm: {field1: value1, ...}, otherForm: {} }
}

// Storage key for sessionStorage
const STORAGE_KEY = "formData_session";

// Load initial state from sessionStorage
const loadStateFromStorage = (): FormState => {
  try {
    const savedState = sessionStorage.getItem(STORAGE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error("Error loading form data from sessionStorage:", error);
  }
  return {};
};

// Save state to sessionStorage
const saveStateToStorage = (state: FormState) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving form data to sessionStorage:", error);
  }
};

const createFormKey = (formKey: string, patientId?: number | string) => {
  return patientId ? `${formKey}_patient_${patientId}` : formKey;
};

// Initialize state from sessionStorage
const initialState: FormState = loadStateFromStorage();

const formDataSlice = createSlice({
  name: "formData",
  initialState,
  reducers: {
    setFormData: (
      state,
      action: PayloadAction<{
        formKey: string;
        data: Record<string, any>;
        patientId?: number | string;
      }>
    ) => {
      const { formKey, data, patientId } = action.payload;
      const uniqueFormKey = createFormKey(formKey, patientId);
      state[uniqueFormKey] = {
        ...(state[uniqueFormKey] || {}),
        ...data,
      };
      // Save to sessionStorage after every update
      saveStateToStorage(state);
    },
    clearFormData: (
      state,
      action: PayloadAction<{ formKey: string; patientId?: number | string }>
    ) => {
      const { formKey, patientId } = action.payload;
      const uniqueFormKey = createFormKey(formKey, patientId);
      delete state[uniqueFormKey];
      // Save to sessionStorage after clearing
      saveStateToStorage(state);
    },
    clearAllFormData: (state) => {
      Object.keys(state).forEach((key) => {
        delete state[key];
      });
      // Clear sessionStorage as well
      saveStateToStorage(state);
    },
  },
});

export const { setFormData, clearFormData, clearAllFormData } =
  formDataSlice.actions;
export default formDataSlice.reducer;
