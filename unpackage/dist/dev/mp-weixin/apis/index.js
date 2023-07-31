"use strict";
const axios_axios = require("../axios/axios.js");
const getABannerList = (params) => {
  return axios_axios.http({
    url: "v1/common/banner",
    params
  });
};
const getACategortList = (path) => {
  return axios_axios.http({
    url: `v1/category/${path}`
  });
};
const getABannerList2 = (params) => {
  return axios_axios.http({
    url: "v1/common/banner",
    params
  });
};
const getAProductList = (params) => {
  return axios_axios.http({
    url: "v1/search/findbycid",
    params
  });
};
const getASubList = (params) => {
  return axios_axios.http({
    url: "v1/category/sublist",
    params
  });
};
const getFindbycid = (params) => {
  return axios_axios.http({
    url: "v1/search/findbycid",
    params
  });
};
const getAboutus = (params) => {
  return axios_axios.http({
    url: "v1/topic/detail",
    params
  });
};
const getSearch = (params) => {
  return axios_axios.http({
    url: "v1/search/find",
    params
  });
};
exports.getABannerList = getABannerList;
exports.getABannerList2 = getABannerList2;
exports.getACategortList = getACategortList;
exports.getAProductList = getAProductList;
exports.getASubList = getASubList;
exports.getAboutus = getAboutus;
exports.getFindbycid = getFindbycid;
exports.getSearch = getSearch;
