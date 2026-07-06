import axios from "./axios";

export const fetchTradplusUpdates = (payload) =>
  axios.get("/tradplus", {
    params: payload,
  });

export const setTradplusUpdates = (payload) => axios.post("/tradplus", payload);
