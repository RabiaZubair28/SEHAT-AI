const DEFAULT_MESSAGE = "Something went wrong. Please try again.";

export const extractErrorMessage = (error: any): string => {
  console.error(error)
  if (!error) return DEFAULT_MESSAGE;

  const msg = error?.data?.message ?? error?.message;

  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string") return msg;

  return DEFAULT_MESSAGE;
};
