"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_index = require("../../apis/index.js");
require("../../axios/axios.js");
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
  __name: "index",
  setup(__props) {
    const AdresList = common_vendor.ref({
      Name: "新地区",
      Remark: "的撒"
    });
    common_vendor.ref();
    const search = (e) => {
      common_vendor.index.navigateTo({
        url: `../search/search?value=${e}`
      });
    };
    const contactCallback = (e) => {
      console.log(e);
    };
    const bannerList = common_vendor.ref([]);
    const bannerList2 = common_vendor.ref([]);
    const CategortList = common_vendor.ref([]);
    const productlist = common_vendor.ref([]);
    common_vendor.onLoad(async () => {
      await Promise.all([
        apis_index.getABannerList({ name: "homehotbanner" }),
        apis_index.getABannerList2({ name: "homehotbanner-second-mobile" }),
        apis_index.getACategortList("homecategories"),
        apis_index.getAProductList({ cid: 105, size: 20 })
      ]).then(([bannerRes, banner2Res, categoryRes, productlistres]) => {
        bannerList.value = bannerRes.Data.Items;
        bannerList.value[0].url = bannerList.value[0].Picture.BigUrl;
        bannerList.value[1].url = bannerList.value[1].Picture.BigUrl;
        bannerList2.value = banner2Res.Data.Items[0].Picture;
        CategortList.value = categoryRes.Data;
        productlist.value = productlistres.Data;
      }).catch((err) => {
        console.log(err);
      });
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(AdresList.value.Name),
        b: common_vendor.t(AdresList.value.Remark),
        c: common_vendor.p({
          name: "arrow-right"
        }),
        d: common_vendor.o(search),
        e: common_vendor.p({
          bgColor: "#fff",
          ["show-action"]: false,
          clearabled: true,
          shape: "round",
          placeholder: "搜一搜"
        }),
        f: common_vendor.f(bannerList.value, (item, index, i0) => {
          return {
            a: item.Picture.BigUrl,
            b: item.Url,
            c: index
          };
        }),
        g: common_vendor.f(CategortList.value, (item, index, i0) => {
          return {
            a: item.Picture.BigUrl,
            b: common_vendor.t(item.Name),
            c: `/pages/subcategory/subcategory?id=${item.Id}&name=${item.Name}`,
            d: index
          };
        }),
        h: bannerList2.value
      }, bannerList2.value ? {
        i: bannerList2.value.BigUrl
      } : {}, {
        j: productlist.value.Items && productlist.value.Items.length
      }, productlist.value.Items && productlist.value.Items.length ? {
        k: common_vendor.t(productlist.value.Name)
      } : {}, {
        l: common_vendor.f(productlist.value.Items, (item, index, i0) => {
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
            i: index,
            j: `/pages/detail/detail?id=${item.Id}`
          });
        }),
        m: common_vendor.o(contactCallback)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1cf27b2a"], ["__file", "E:/Uni-App/urshop/pages/index/index.vue"]]);
wx.createPage(MiniProgramPage);
