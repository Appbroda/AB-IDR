// toast.js
let toastHandler = null;

export const registerToast = (fn) => {
  toastHandler = fn;
};

const toast = {
  success: (msg) => toastHandler?.success(msg),
  error: (msg) => toastHandler?.error(msg),
  warning: (msg) => toastHandler?.warning(msg),
  info: (msg) => toastHandler?.info(msg),
};

export default toast;
