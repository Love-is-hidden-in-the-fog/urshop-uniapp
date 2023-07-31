"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  const _easycom_u_search2 = common_vendor.resolveComponent("u-search");
  (_easycom_u_icon2 + _easycom_u_search2)();
}
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
const _easycom_u_search = () => "../../uni_modules/uview-plus/components/u-search/u-search.js";
if (!Math) {
  (_easycom_u_icon + _easycom_u_search)();
}
const _sfc_main = {
  __name: "options",
  setup(__props) {
    const currentAdres = common_vendor.ref({
      Name: "新地区",
      Address: ""
    });
    const AdresList = common_vendor.ref([]);
    common_vendor.ref([]);
    const searchList = common_vendor.ref([]);
    common_vendor.ref(false);
    const searchPage = common_vendor.ref(false);
    common_vendor.ref(false);
    const search = (e) => {
      console.log(e);
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(currentAdres.value.Name),
        b: common_vendor.t(currentAdres.value.Address),
        c: common_vendor.p({
          name: "checkmark",
          size: "50rpx",
          color: "#fff"
        }),
        d: common_vendor.o(search),
        e: common_vendor.p({
          bgColor: "#f5f5f5",
          ["show-action"]: false,
          clearabled: true,
          shape: "round",
          placeholder: "搜一搜"
        }),
        f: !searchPage.value
      }, !searchPage.value ? {
        g: common_vendor.f(AdresList.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.adres.Name),
            b: common_vendor.t(item.adres.Address),
            c: item.distance < 1e3
          }, item.distance < 1e3 ? {
            d: common_vendor.t(item.distance)
          } : {}, {
            e: item.distance >= 1e3
          }, item.distance >= 1e3 ? {
            f: common_vendor.t(item.distance / 1e3 | _ctx.Int)
          } : {}, {
            g: index
          });
        })
      } : {}, {
        h: searchPage.value
      }, searchPage.value ? common_vendor.e({
        i: common_vendor.f(searchList.value, (item, index, i0) => {
          return common_vendor.e({
            a: common_vendor.t(item.adres.Name),
            b: common_vendor.t(item.adres.Address),
            c: item.distance < 1e3
          }, item.distance < 1e3 ? {
            d: common_vendor.t(item.distance)
          } : {}, {
            e: item.distance >= 1e3
          }, item.distance >= 1e3 ? {
            f: common_vendor.t(item.distance / 1e3 | _ctx.Int)
          } : {}, {
            g: index
          });
        }),
        j: !searchList.value.length
      }, !searchList.value.length ? {} : {}) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/Uni-App/urshop/pages/options/options.vue"]]);
wx.createPage(MiniProgramPage);
