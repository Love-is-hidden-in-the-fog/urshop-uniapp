"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {};
if (!Array) {
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  _easycom_u_icon2();
}
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
if (!Math) {
  _easycom_u_icon();
}
function _sfc_render(_ctx, _cache) {
  return {
    a: common_vendor.p({
      name: "order",
      color: "#999",
      size: "300",
      label: "暂时没有退货订单",
      ["label-pos"]: "bottom",
      labelSize: "50"
    })
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "E:/Uni-App/urshop/pages/orderList/orderList.vue"]]);
wx.createPage(MiniProgramPage);
