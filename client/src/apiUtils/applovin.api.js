import axios from "./axios";

export const fetchUpdates = (payload) =>
  axios.get("/applovin", {
    params: payload,
  });

export const setUpdates = (payload) => axios.post("/applovin", payload);
