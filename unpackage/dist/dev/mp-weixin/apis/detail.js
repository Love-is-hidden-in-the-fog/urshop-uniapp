"use strict";
const axios_axios = require("../axios/axios.js");
const getbyidList = (params) => {
  return axios_axios.http({
    url: "v1/goods/getbyid",
    params
  });
};
exports.getbyidList = getbyidList;
