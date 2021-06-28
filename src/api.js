const axios = require("axios");

exports.api = axios.create({
  baseURL: "https://api.thecatapi.com/",
});

api.default.headers.common["x-api-key"] = process.env.CAT_API_KEY;
