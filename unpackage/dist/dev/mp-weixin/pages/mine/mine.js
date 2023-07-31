"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_index = require("../../apis/index.js");
require("../../axios/axios.js");
if (!Array) {
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  _easycom_u_icon2();
}
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
if (!Math) {
  _easycom_u_icon();
}
const _sfc_main = {
  __name: "mine",
  setup(__props) {
    let username = common_vendor.ref("11");
    let bannerList2 = common_vendor.ref([]);
    let item1 = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "审核中",
        success: function(res) {
          if (res.confirm) {
            console.log("用户点击确定");
          } else if (res.cancel) {
            console.log("用户点击取消");
          }
        }
      });
    };
    let nav = (name) => {
      switch (name) {
        case "order":
          console.log("order");
          common_vendor.index.navigateTo({
            url: "../order/order"
          });
          break;
        case "orderList":
          console.log("orderList");
          common_vendor.index.navigateTo({
            url: "../orderList/orderList"
          });
          break;
        case "address":
          console.log("address");
          common_vendor.index.navigateTo({
            url: "../address/address"
          });
          break;
        case "question":
          console.log("question");
          common_vendor.index.navigateTo({
            url: "../question/question?name=aboutus"
          });
          break;
        case "question2":
          common_vendor.index.navigateTo({
            url: "../question/question?name=serviceProtocol"
          });
          console.log("question2");
          break;
      }
    };
    common_vendor.onLoad(async () => {
      const res = await apis_index.getABannerList2({ name: "homehotbanner-second-mobile" });
      bannerList2.value = res.Data.Items;
      console.log(bannerList2.value);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(common_vendor.unref(username)),
        b: common_vendor.p({
          size: "40",
          name: "man-add"
        }),
        c: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        d: common_vendor.o((...args) => common_vendor.unref(item1) && common_vendor.unref(item1)(...args)),
        e: common_vendor.p({
          size: "40",
          name: "file-text-fill"
        }),
        f: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        g: common_vendor.o(($event) => common_vendor.unref(nav)("order")),
        h: common_vendor.p({
          size: "40",
          name: "question-circle"
        }),
        i: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        j: common_vendor.o(($event) => common_vendor.unref(nav)("orderList")),
        k: common_vendor.p({
          size: "40",
          name: "map-fill"
        }),
        l: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        m: common_vendor.o(($event) => common_vendor.unref(nav)("address")),
        n: common_vendor.p({
          size: "40",
          name: "server-man"
        }),
        o: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        p: common_vendor.p({
          size: "40",
          name: "info-circle-fill"
        }),
        q: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        r: common_vendor.o(($event) => common_vendor.unref(nav)("question")),
        s: common_vendor.p({
          size: "40",
          name: "info-circle-fill"
        }),
        t: common_vendor.p({
          color: "#ccc",
          size: "40",
          name: "arrow-right"
        }),
        v: common_vendor.o(($event) => common_vendor.unref(nav)("question2")),
        w: common_vendor.unref(bannerList2).length !== 0
      }, common_vendor.unref(bannerList2).length !== 0 ? {
        x: common_vendor.unref(bannerList2)[0].Picture.BigUrl,
        y: common_vendor.unref(bannerList2)[0].Url
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/Uni-App/urshop/pages/mine/mine.vue"]]);
wx.createPage(MiniProgramPage);
