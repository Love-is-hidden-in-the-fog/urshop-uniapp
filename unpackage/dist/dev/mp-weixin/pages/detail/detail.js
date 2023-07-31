"use strict";
const common_vendor = require("../../common/vendor.js");
const apis_detail = require("../../apis/detail.js");
require("../../axios/axios.js");
if (!Array) {
  const _easycom_u_swiper2 = common_vendor.resolveComponent("u-swiper");
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  const _easycom_u_number_box2 = common_vendor.resolveComponent("u-number-box");
  const _easycom_u_popup2 = common_vendor.resolveComponent("u-popup");
  (_easycom_u_swiper2 + _easycom_u_icon2 + _easycom_u_number_box2 + _easycom_u_popup2)();
}
const _easycom_u_swiper = () => "../../uni_modules/uview-plus/components/u-swiper/u-swiper.js";
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
const _easycom_u_number_box = () => "../../uni_modules/uview-plus/components/u-number-box/u-number-box.js";
const _easycom_u_popup = () => "../../uni_modules/uview-plus/components/u-popup/u-popup.js";
if (!Math) {
  (_easycom_u_swiper + _easycom_u_icon + _easycom_u_number_box + _easycom_u_popup)();
}
const _sfc_main = {
  __name: "detail",
  setup(__props) {
    let swiperList = common_vendor.ref([]);
    let GoodData = common_vendor.ref({});
    let newrolename = common_vendor.ref("");
    let value = common_vendor.ref(10);
    let showData = common_vendor.ref(true);
    common_vendor.ref("");
    const click = (e) => {
      console.log(e);
    };
    const change = (e) => {
    };
    const valChange = (e) => {
      console.log(e);
    };
    const showSku = () => {
      show.value = true;
    };
    const close = () => {
      show.value = false;
    };
    const contactCallback = (e) => {
    };
    const addCart = (e) => {
      console.log(GoodData.value);
      let goodsinfo = GoodData.value;
      let cart = common_vendor.index.getStorageSync("cart") || [];
      console.log(cart);
      let index = cart.findIndex((item) => item.Id == goodsinfo.Id);
      if (index !== -1) {
        cart[index].num++;
      } else {
        goodsinfo.num = 1;
        goodsinfo.checked = true;
        cart.push(goodsinfo);
      }
      common_vendor.index.setStorageSync("cart", cart);
      common_vendor.index.showToast({
        icon: "success",
        title: "添加成功"
      });
    };
    const buyBtn = (e) => {
    };
    const goHome = () => {
      common_vendor.wx$1.switchTab({
        url: "/pages/index/index"
      });
    };
    let show = common_vendor.ref(false);
    common_vendor.onLoad(async (option) => {
      console.log(option);
      await Promise.all([
        await apis_detail.getbyidList({ id: option.id })
      ]).then(([res1]) => {
        GoodData.value = res1.Data;
        console.log(GoodData);
        if (GoodData.value == null) {
          showData.value = false;
        }
        swiperList.value = res1.Data.Pictures;
      }).catch((err) => {
        console.log(err);
        showData.value = false;
      });
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(showData)
      }, common_vendor.unref(showData) ? common_vendor.e({
        b: common_vendor.o(click),
        c: common_vendor.o(change),
        d: common_vendor.p({
          height: "750",
          keyName: "BigUrl",
          list: common_vendor.unref(swiperList)
        }),
        e: common_vendor.t(common_vendor.unref(GoodData).Price),
        f: common_vendor.t(common_vendor.unref(newrolename) ? common_vendor.unref(newrolename) : "会员"),
        g: common_vendor.unref(GoodData).OldPrice !== "¥0.00"
      }, common_vendor.unref(GoodData).OldPrice !== "¥0.00" ? {
        h: common_vendor.t(common_vendor.unref(GoodData).OldPrice)
      } : {}, {
        i: common_vendor.p({
          color: "#930009",
          name: "share"
        }),
        j: common_vendor.t(common_vendor.unref(GoodData).Name),
        k: common_vendor.p({
          name: "tags-fill"
        }),
        l: common_vendor.t(common_vendor.unref(GoodData).SaleVolume),
        m: common_vendor.p({
          name: "file-text-fill"
        }),
        n: common_vendor.t(common_vendor.unref(GoodData).StockQuantity),
        o: common_vendor.p({
          name: "car"
        }),
        p: common_vendor.t(common_vendor.unref(GoodData).Short),
        q: common_vendor.p({
          name: "arrow-right"
        }),
        r: common_vendor.o(showSku),
        s: common_vendor.t(common_vendor.unref(GoodData).Attrs[0].Name),
        t: common_vendor.t(common_vendor.unref(GoodData).Attrs[0].Values[0].Name),
        v: common_vendor.t(common_vendor.unref(GoodData).Attrs[0].Values[1].Name),
        w: common_vendor.t(common_vendor.unref(GoodData).Attrs[1].Name),
        x: common_vendor.t(common_vendor.unref(GoodData).Attrs[1].Values[0].Name),
        y: common_vendor.t(common_vendor.unref(GoodData).Attrs[1].Values[1].Name),
        z: common_vendor.t(common_vendor.unref(GoodData).StockQuantity),
        A: common_vendor.o(valChange),
        B: common_vendor.o(($event) => common_vendor.isRef(value) ? value.value = $event : value = $event),
        C: common_vendor.p({
          iconStyle: " padding:22rpx 22rpx ; border: 1rpx solid #848484; backgroundColor:#ccc;",
          ["button-size"]: "40",
          bgColor: "#fff",
          min: 1,
          max: 100,
          modelValue: common_vendor.unref(value)
        }),
        D: common_vendor.o(close),
        E: common_vendor.p({
          show: common_vendor.unref(show),
          customStyle: "padding:40rpx 20rpx ;"
        }),
        F: common_vendor.unref(GoodData).Full,
        G: common_vendor.p({
          size: "40",
          name: "kefu-ermai"
        }),
        H: common_vendor.o(contactCallback),
        I: common_vendor.o(goHome),
        J: common_vendor.p({
          size: "40",
          name: "home"
        }),
        K: common_vendor.o(goHome),
        L: common_vendor.p({
          size: "40",
          name: "shopping-cart"
        }),
        M: common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity != 0
      }, common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity != 0 ? {
        N: common_vendor.o(addCart),
        O: common_vendor.o(buyBtn)
      } : {}, {
        P: !common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity == 0
      }, !common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity == 0 ? {} : {}, {
        Q: !common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity != 0
      }, !common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity != 0 ? {} : {}, {
        R: common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity == 0
      }, common_vendor.unref(GoodData).Published && common_vendor.unref(GoodData).StockQuantity == 0 ? {} : {}) : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-eca06f3c"], ["__file", "E:/Uni-App/urshop/pages/detail/detail.vue"]]);
wx.createPage(MiniProgramPage);
