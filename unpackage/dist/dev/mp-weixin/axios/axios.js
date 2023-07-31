"use strict";
const common_vendor = require("../common/vendor.js");
const http = common_vendor.axios.create({
  baseURL: "http://demo.urshop.cn/api",
  method: "GET",
  header: {
    "Content-Type": "application/json; charset=UTF-8"
    // guid: wx.getStorageSync('guid'),
    // authorization: wx.getStorageSync('token')
  }
});
http.interceptors.request.use((config) => {
  config.headers.Authorization = localStorage.getItem("token");
  return config;
});
http.interceptors.response.use((res) => {
  let data = res.data;
  return data;
});
exports.http = http;

