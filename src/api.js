const axios = require("axios").default;

axios.defaults.headers.common["x-api-key"] = process.env.CAT_API_KEY;

const api = axios.create({
  baseURL: "https://api.thecatapi.com/",
});

module.exports = api;
