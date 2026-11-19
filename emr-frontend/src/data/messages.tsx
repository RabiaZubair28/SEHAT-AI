// /src/constants/messages.ts

export const LOGIN_MESSAGES = {
  SUCCESS: {
    type: "success",
    title: "Login Successful",
    description: "You have been logged in successfully",
  },
  FAILURE: {
    type: "error",
    title: "Login Failed",
    decription: "Something went wrong. Please try again.",
  },
};

export const REGISTER_MESSAGES = {
  SUCCESS: {
    type: "success",
    title: "Registration Successful",
    description: "Your account has been created.",
  },
};

export const SIGNUP_MESSAGES = {
  SUCCESS: {
    type: "success",
    title: "Registration Successful",
    description: "You have registered successfully.",
  },
  FAILURE: {
    type: "error",
    title: "Registration Failed",
    description: "An error occurred during registration.",
  },

  STEPS_SUCCESS: {
    type: "success",
    title: "Data Saved",
    description: "Your data has been saved successfully.",
  },
  STEPS_FAILED: {
    type: "error",
    title: "Fill Required Fields",
    description: "Please fill in all required fields.",
  },
};

export const IMPERSONATION_MESSAGES = {
  SUCCESS: {
    type: "success",
    title: "Impersonation Successful",
    description: "You are now impersonating the selected user.",
  },
  FAILURE: {
    type: "error",
    title: "Impersonation Failed",
    description: "Something went wrong. Please try again.",
  },
};
