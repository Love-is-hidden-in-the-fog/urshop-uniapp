"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "address",
  setup(__props) {
    common_vendor.ref([]);
    let formdata = common_vendor.ref({});
    const nav = () => {
      common_vendor.index.navigateTo({
        url: "../address-editor/address-editor"
      });
    };
    common_vendor.onLoad((option) => {
      console.log(option);
      if (Object.keys(option).length !== 0) {
        formdata.value = {
          name: option.name,
          phone: option.phone,
          address: option.address,
          addressDetail: option.addressDetail
        };
      }
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: Object.keys(common_vendor.unref(formdata)).length === 0
      }, Object.keys(common_vendor.unref(formdata)).length === 0 ? {} : {}, {
        b: Object.keys(common_vendor.unref(formdata)).length !== 0
      }, Object.keys(common_vendor.unref(formdata)).length !== 0 ? {
        c: common_vendor.t(common_vendor.unref(formdata).name),
        d: common_vendor.t(common_vendor.unref(formdata).phone),
        e: common_vendor.t(common_vendor.unref(formdata).address),
        f: common_vendor.t(common_vendor.unref(formdata).addressDetail)
      } : {}, {
        g: common_vendor.o(nav)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-40ca010a"], ["__file", "E:/Uni-App/urshop/pages/address/address.vue"]]);
wx.createPage(MiniProgramPage);
