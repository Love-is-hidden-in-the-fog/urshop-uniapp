"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_index = require("../../apis/index.js");
require("../../axios/axios.js");
const _sfc_main = {
  __name: "question",
  setup(__props) {
    let data = common_vendor.ref();
    common_vendor.onLoad(async (option) => {
      const res = await apis_index.getAboutus({ systemName: option.name });
      data.value = res.Data.Body;
      common_vendor.index.setNavigationBarTitle({
        title: res.Data.Title
      });
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.unref(data)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-a6df9a91"], ["__file", "E:/Uni-App/urshop/pages/question/question.vue"]]);
wx.createPage(MiniProgramPage);
