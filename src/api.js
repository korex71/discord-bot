const axios = require("axios").default;

const api = axios.create({
  baseURL: "https://api.thecatapi.com/",
});

api.default.headers.common["x-api-key"] = process.env.CAT_API_KEY;

module.exports = api;
