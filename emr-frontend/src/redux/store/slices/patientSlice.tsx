import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Service {
  id: number;
  name: string;
}

interface AppointmentService {
  service: Service;
  id?: number;
  status?: string;
}

interface SelectedPatientData {
  appointmentId?: number | null;
  appointmentStatus?: string | null;
  id?: number;
  selectedServiceRoute?: string;
  selectedServiceIdFromCard?: number | undefined;
  patientData?: Record<string, any>;
  visit?: Record<string, any> | null;
  appointmentServices?: AppointmentService[];
  vitals?: [] | null;
  name?: string;
  mrNo?: string;
  age?: number | string | null;
}

interface AuthState {
  selectedPatientData: SelectedPatientData | null;
}

const initialState: AuthState = {
  selectedPatientData: null,
};

const patientRecordReducer = createSlice({
  name: "patientRecords",
  initialState,
  reducers: {
    setSelectedPatientData: (
      state,
      action: PayloadAction<SelectedPatientData>
    ) => {
      state.selectedPatientData = action.payload;
    },
    clearSelectedPatientData: (state) => {
      state.selectedPatientData = null;
    },
    // setSelectedPatientAppointmentId: (state, action: PayloadAction<Number>) => {
    //   const id = action.payload;
    //   state.selectedPatientAppointmentId = id;
    // },
  },
});

export const { setSelectedPatientData, clearSelectedPatientData } =
  patientRecordReducer.actions;

export default patientRecordReducer.reducer;
