import { enqueueSnackbar } from "notistack";

const toast = {
  success: (message) => enqueueSnackbar(message, { variant: "success" }),
  error: (message) => enqueueSnackbar(message, { variant: "error" }),
  warning: (message) => enqueueSnackbar(message, { variant: "warning" }),
  info: (message) => enqueueSnackbar(message, { variant: "info" }),
};

export default toast;
