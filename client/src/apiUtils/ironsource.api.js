import axios from "./axios";

export const fetchUpdates = (payload) =>
  axios.get("/ironsource", {
    params: payload,
  });

export const setUpdates = (payload) => axios.post("/ironsource", payload);
