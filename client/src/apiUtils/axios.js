import Axios from "axios";
import toast from "../components/enqueueSnackbar";

const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

axios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error),
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errorMessage ||
      error.message ||
      "Something went wrong";

    if (error.code !== "ERR_CANCELED") {
      console.log("here", message);
      toast.error(message);
    }
    return Promise.reject(error);
  },
);

export default axios;
