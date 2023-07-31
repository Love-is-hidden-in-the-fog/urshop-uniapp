"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  __name: "address-editor",
  setup(__props) {
    const formSubmit = (e) => {
      if (e.detail.value.phone.length !== 11) {
        common_vendor.index.showToast({
          icon: "error",
          title: "手机号码格式不对"
        });
        return;
      }
      if (e.detail.value.name.length == 0) {
        common_vendor.index.showToast({
          icon: "error",
          title: "姓名不能为空"
        });
        return;
      }
      let formdata = e.detail.value;
      console.log(formdata);
      common_vendor.index.navigateTo({
        url: `../address/address?name=${formdata.name}&address=${formdata.address}&phone=${formdata.phone}&addressDetail=${formdata.addressDetai}&`
      });
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(formSubmit)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4e9cc4f4"], ["__file", "E:/Uni-App/urshop/pages/address-editor/address-editor.vue"]]);
wx.createPage(MiniProgramPage);
