"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_index = require("../../apis/index.js");
require("../../axios/axios.js");
if (!Array) {
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  _easycom_u_button2();
}
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
if (!Math) {
  _easycom_u_button();
}
const _sfc_main = {
  __name: "order",
  setup(__props) {
    let activeTab = common_vendor.ref("全部");
    let productlist = common_vendor.ref([]);
    const changeTab = (tab) => {
      activeTab.value = tab;
    };
    common_vendor.onLoad(async () => {
      const res = await apis_index.getAProductList({
        cid: 105,
        size: 20
      });
      productlist.value = res.Data.Items;
      console.log(productlist.value);
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.unref(activeTab) === "全部" ? 1 : "",
        b: common_vendor.o(($event) => changeTab("全部")),
        c: common_vendor.unref(activeTab) === "待付款" ? 1 : "",
        d: common_vendor.o(($event) => changeTab("待付款")),
        e: common_vendor.unref(activeTab) === "待配送" ? 1 : "",
        f: common_vendor.o(($event) => changeTab("待配送")),
        g: common_vendor.unref(activeTab) === "待收获" ? 1 : "",
        h: common_vendor.o(($event) => changeTab("待收获")),
        i: common_vendor.unref(activeTab) === "已收货" ? 1 : "",
        j: common_vendor.o(($event) => changeTab("已收货")),
        k: common_vendor.f(common_vendor.unref(productlist), (item, index, i0) => {
          return common_vendor.e({
            a: item.Picture.NormalUrl,
            b: common_vendor.t(item.Name),
            c: item.Id,
            d: common_vendor.t(item.Short),
            e: item.Id,
            f: common_vendor.t(item.Price.Price),
            g: item.Price.OldPrice !== "¥0.00"
          }, item.Price.OldPrice !== "¥0.00" ? {
            h: common_vendor.t(item.Price.OldPrice)
          } : {}, {
            i: `/pages/detail/detail?id=${item.Id}`,
            j: "93207a4f-0-" + i0,
            k: "93207a4f-1-" + i0,
            l: index
          });
        }),
        l: common_vendor.p({
          plain: true,
          text: "加入购物车",
          color: "#950000"
        }),
        m: common_vendor.p({
          text: "删除商品",
          color: "#950000"
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-93207a4f"], ["__file", "E:/Uni-App/urshop/pages/order/order.vue"]]);
wx.createPage(MiniProgramPage);
