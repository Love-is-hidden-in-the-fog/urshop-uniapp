"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_index = require("../../apis/index.js");
require("../../axios/axios.js");
if (!Array) {
  const _easycom_u_tabs2 = common_vendor.resolveComponent("u-tabs");
  _easycom_u_tabs2();
}
const _easycom_u_tabs = () => "../../uni_modules/uview-plus/components/u-tabs/u-tabs.js";
if (!Math) {
  _easycom_u_tabs();
}
const _sfc_main = {
  __name: "subcategory",
  setup(__props) {
    let subcatelist = common_vendor.ref([]);
    let subcateProduct = common_vendor.ref([]);
    common_vendor.onLoad(async (option) => {
      console.log(option);
      const subListRes = await apis_index.getASubList({ catId: option.id });
      console.log(subListRes.Data.length);
      if (subListRes.Data.length !== 0) {
        subcatelist.value = subListRes.Data;
        const findRes = await apis_index.getFindbycid({ cid: subListRes.Data[0].Id, page: 1 });
        console.log(findRes);
        subcateProduct.value = findRes.Data.Items;
      } else {
        const findRes = await apis_index.getFindbycid({ cid: option.id, page: 1 });
        console.log(findRes);
        subcateProduct.value = findRes.Data.Items;
      }
    });
    const click = (item) => {
      console.log(item);
    };
    const lower = (item) => {
      console.log(item);
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(click),
        b: common_vendor.p({
          lineColor: "#950000",
          lineWidth: "50",
          lineHeight: "10",
          list: common_vendor.unref(subcatelist),
          keyName: "Name"
        }),
        c: common_vendor.f(common_vendor.unref(subcateProduct), (item, index, i0) => {
          return {
            a: item.Picture.BigUrl,
            b: common_vendor.t(item.Name),
            c: common_vendor.t(item.Short),
            d: common_vendor.t(item.Price.Price),
            e: `/pages/detail/detail?id=${item.Id}`,
            f: index,
            g: index
          };
        }),
        d: !common_vendor.unref(subcatelist).length ? 1 : "",
        e: common_vendor.o(lower)
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-acfd45df"], ["__file", "E:/Uni-App/urshop/pages/subcategory/subcategory.vue"]]);
wx.createPage(MiniProgramPage);
