import { User, Service } from "@/config/sidebarConfig";
import { Permission } from "@/data/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the initial state type
interface AuthState {
  user: User | null;
  userPermissions: Permission | null;
  userServices: Service[] | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null, // Initialize with null
  userPermissions: null,
  userServices: null,
  token: null,
};

const authSlice = createSlice({
  name: "authUser",
  initialState,
  reducers: {
    setUserCredentials: (state, action: PayloadAction<User>) => {
      const user = action.payload ?? action;
      state.user = user;
      state.userPermissions = user.userPermissions.permission;
      state.userServices = user.services || null;
    },
    setUserToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setUserMustChangePassword: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.must_change_password = action.payload;
      }
    },
  },
});

export const {
  setUserCredentials,
  setUserToken,
  setUserMustChangePassword,
} = authSlice.actions;
export default authSlice.reducer;
