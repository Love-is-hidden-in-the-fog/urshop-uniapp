"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_index = require("../../apis/index.js");
require("../../axios/axios.js");
if (!Array) {
  const _easycom_u_search2 = common_vendor.resolveComponent("u-search");
  _easycom_u_search2();
}
const _easycom_u_search = () => "../../uni_modules/uview-plus/components/u-search/u-search.js";
if (!Math) {
  _easycom_u_search();
}
const _sfc_main = {
  __name: "search",
  setup(__props) {
    let searchContent = common_vendor.ref([]);
    let page = common_vendor.ref(1);
    const keyword = common_vendor.ref("");
    const search = async (val) => {
      console.log(val);
      const res = await apis_index.getSearch({ q: val, page: page.value });
      searchContent.value = res.Data.Items;
      console.log(searchContent.value);
    };
    const searchLower = async () => {
      page.value++;
      const res = await apis_index.getSearch({ q: keyword.value, page: page.value });
      searchContent.value = [...searchContent.value, ...res.Data.Items];
      console.log(searchContent.value);
    };
    common_vendor.onLoad((option) => {
      keyword.value = option.value;
      search(keyword.value);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.o(search),
        b: common_vendor.o(($event) => keyword.value = $event),
        c: common_vendor.p({
          bgColor: "#fff",
          ["show-action"]: false,
          clearabled: true,
          shape: "round",
          placeholder: "搜一搜",
          modelValue: keyword.value
        }),
        d: common_vendor.unref(searchContent).length !== 0
      }, common_vendor.unref(searchContent).length !== 0 ? common_vendor.e({
        e: common_vendor.f(common_vendor.unref(searchContent), (item, index, i0) => {
          return {
            a: item.Picture.NormalUrl,
            b: common_vendor.t(item.Name),
            c: common_vendor.t(item.SaleVolume),
            d: common_vendor.t(item.Price.Price),
            e: `/pages/detail/detail?id=${item.Id}`,
            f: index
          };
        }),
        f: common_vendor.unref(searchContent).length == 0
      }, common_vendor.unref(searchContent).length == 0 ? {} : {}, {
        g: common_vendor.o(searchLower)
      }) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-c10c040c"], ["__file", "E:/Uni-App/urshop/pages/search/search.vue"]]);
wx.createPage(MiniProgramPage);
