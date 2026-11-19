import { User } from "@/config/sidebarConfig";
import { Permission } from "@/data/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Define the initial state type
interface AuthState {
  admin: User | null;
  adminPermissions: Permission | null;
  userModuleServices: any | null;
  token: string | null;
}

const initialState: AuthState = {
  admin: null, // Initialize with null
  adminPermissions: null,
  userModuleServices: null,
  token: null,
};

const authAdminSlice = createSlice({
  name: "authAdmin",
  initialState,
  reducers: {
    setAdminCredentials: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      state.admin = user;
      state.adminPermissions = user.userPermissions.permission;
    },
    setServices: (state, action: PayloadAction<any>) => {
      const services = action.payload;
      state.userModuleServices = services;
    },
     setAdminToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setAdminMustChangePassword: (state, action: PayloadAction<boolean>) => {
      if (state.admin) {
        state.admin.must_change_password = action.payload;
      }
    },
  },
});

export const {
  setAdminCredentials,
  setAdminToken,
  setServices,
  setAdminMustChangePassword,
} = authAdminSlice.actions;
export default authAdminSlice.reducer;
