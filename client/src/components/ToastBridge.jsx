import { useEffect } from "react";
import { useSnackbar } from "notistack";
import { registerToast } from "../utils/toast";

export const ToastBridge = () => {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    registerToast({
      success: (msg) => enqueueSnackbar(msg, { variant: "success" }),
      error: (msg) => enqueueSnackbar(msg, { variant: "error" }),
      warning: (msg) => enqueueSnackbar(msg, { variant: "warning" }),
      info: (msg) => enqueueSnackbar(msg, { variant: "info" }),
    });
  }, [enqueueSnackbar]);

  return null;
};
