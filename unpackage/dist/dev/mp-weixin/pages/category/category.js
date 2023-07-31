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
  __name: "category",
  setup(__props) {
    const search = (e) => {
      console.log(e);
    };
    let selected = common_vendor.ref(0);
    let cateProduct0 = common_vendor.ref([]);
    let cateProduct1 = common_vendor.ref([]);
    let cateProduct2 = common_vendor.ref([]);
    let cateProduct3 = common_vendor.ref([]);
    const selectTab = async (index) => {
      selected.value = index;
    };
    let sublist = common_vendor.ref([]);
    common_vendor.onLoad(async () => {
      const subListRes = await apis_index.getASubList();
      sublist.value = subListRes.Data;
      await Promise.all([
        await apis_index.getFindbycid({ cid: sublist.value[0].Id, page: 1 }),
        await apis_index.getASubList({ catId: sublist.value[1].Id }),
        await apis_index.getFindbycid({ cid: sublist.value[2].Id, page: 1 }),
        await apis_index.getFindbycid({ cid: sublist.value[3].Id, page: 1 })
      ]).then(([findRes0, findRes1, findRes2, findRes3]) => {
        cateProduct0.value = findRes0.Data.Items;
        cateProduct1.value = findRes1.Data;
        cateProduct2.value = findRes2.Data.Items;
        cateProduct3.value = findRes3.Data.Items;
      }).catch((err) => {
        console.log(err);
      });
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(search),
        b: common_vendor.p({
          bgColor: "#fff",
          ["show-action"]: false,
          clearabled: true,
          shape: "round",
          placeholder: "搜一搜"
        }),
        c: common_vendor.f(common_vendor.unref(sublist), (item, index, i0) => {
          return common_vendor.e({
            a: index !== 4
          }, index !== 4 ? {
            b: common_vendor.t(item.Name),
            c: common_vendor.o(($event) => selectTab(index), index),
            d: common_vendor.unref(selected) === index ? 1 : ""
          } : {}, {
            e: index
          });
        }),
        d: common_vendor.f(common_vendor.unref(sublist), (item, index, i0) => {
          return common_vendor.e({
            a: index !== 4 && common_vendor.unref(selected) == index
          }, index !== 4 && common_vendor.unref(selected) == index ? common_vendor.e({
            b: index == 1
          }, index == 1 ? {
            c: common_vendor.f(common_vendor.unref(cateProduct1), (item1, index1, i1) => {
              return {
                a: item1.ImageUrl,
                b: common_vendor.t(item1.Name),
                c: `/pages/subcategory/subcategory?id=${item1.Id}`,
                d: index1
              };
            })
          } : {}, {
            d: index == 0
          }, index == 0 ? {
            e: common_vendor.f(common_vendor.unref(cateProduct0), (item2, index2, i1) => {
              return {
                a: item2.Picture.NormalUrl,
                b: common_vendor.t(item2.Name),
                c: `/pages/detail/detail?id=${item2.Id}`,
                d: index2
              };
            })
          } : {}, {
            f: index == 2
          }, index == 2 ? {
            g: common_vendor.f(common_vendor.unref(cateProduct2), (item2, index2, i1) => {
              return {
                a: item2.Picture.NormalUrl,
                b: common_vendor.t(item2.Name),
                c: `/pages/detail/detail?id=${item2.Id}`,
                d: index2
              };
            })
          } : {}, {
            h: index == 3
          }, index == 3 ? {
            i: common_vendor.f(common_vendor.unref(cateProduct3), (item2, index2, i1) => {
              return {
                a: item2.Picture.NormalUrl,
                b: common_vendor.t(item2.Name),
                c: `/pages/detail/detail?id=${item2.Id}`,
                d: index2
              };
            })
          } : {}) : {}, {
            j: index !== 4 && common_vendor.unref(selected) == index
          }, index !== 4 && common_vendor.unref(selected) == index ? common_vendor.e({
            k: index == 0
          }, index == 0 ? {} : {}, {
            l: index == 2
          }, index == 2 ? {} : {}) : {}, {
            m: index
          });
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-8145b772"], ["__file", "E:/Uni-App/urshop/pages/category/category.vue"]]);
wx.createPage(MiniProgramPage);
