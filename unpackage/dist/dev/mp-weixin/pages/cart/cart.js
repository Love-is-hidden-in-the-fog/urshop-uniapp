"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_u_icon2 = common_vendor.resolveComponent("u-icon");
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  const _easycom_u__image2 = common_vendor.resolveComponent("u--image");
  (_easycom_u_icon2 + _easycom_u_button2 + _easycom_u__image2)();
}
const _easycom_u_icon = () => "../../uni_modules/uview-plus/components/u-icon/u-icon.js";
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
const _easycom_u__image = () => "../../uni_modules/uview-plus/components/u--image/u--image.js";
if (!Math) {
  (_easycom_u_icon + _easycom_u_button + _easycom_u__image)();
}
const _sfc_main = {
  __name: "cart",
  setup(__props) {
    const gocategory = (e) => {
      common_vendor.index.switchTab({
        url: "../category/category"
      });
    };
    let cartList = common_vendor.ref([]);
    let allChecked = common_vendor.ref(false);
    let totalPrice = common_vendor.ref(0);
    let totalNum = common_vendor.ref(0);
    const handleItemAllCheck = (e) => {
      allChecked.value = !allChecked.value;
      cartList.value.forEach((item) => {
        item.checked = allChecked.value;
      });
      console.log(allChecked.value);
      gettotal(cartList.value);
    };
    const handleItemChange = (index) => {
      cartList.value[index].checked = !cartList.value[index].checked;
      let i = cartList.value.findIndex((item) => item.checked === false);
      if (i == -1) {
        allChecked.value = true;
      } else {
        allChecked.value = false;
      }
      gettotal(cartList.value);
    };
    const editor = (choose, index) => {
      if (choose == 0) {
        cartList.value[index].num++;
      } else {
        cartList.value[index].num--;
        if (cartList.value[index].num == 0) {
          cartList.value.splice(index, 1);
        }
      }
      common_vendor.index.setStorageSync("cart", cartList.value);
      gettotal(cartList.value);
    };
    const gettotal = (cartList2) => {
      totalNum.value = 0;
      totalPrice.value = 0;
      cartList2.forEach((item) => {
        if (item.checked == true) {
          totalNum.value += item.num;
          let price = item.Price;
          price = parseFloat(price.replace("¥", ""));
          totalPrice.value += item.num * price;
        }
      });
      totalPrice.value = totalPrice.value.toFixed(2);
    };
    common_vendor.onShow(() => {
      cartList.value = common_vendor.index.getStorageSync("cart");
      console.log(cartList.value);
      let i = cartList.value.findIndex((item) => item.checked === false);
      if (i == -1) {
        allChecked.value = true;
      } else {
        allChecked.value = false;
      }
      gettotal(cartList.value);
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.unref(cartList).length == 0
      }, common_vendor.unref(cartList).length == 0 ? {
        b: common_vendor.p({
          color: "#ccc",
          size: "200",
          name: "shopping-cart"
        }),
        c: common_vendor.o(gocategory),
        d: common_vendor.p({
          color: "#950000",
          text: "去逛逛"
        })
      } : {
        e: common_vendor.f(common_vendor.unref(cartList), (item, index, i0) => {
          return {
            a: item.checked,
            b: common_vendor.o(($event) => handleItemChange(index), index),
            c: "293e72af-2-" + i0,
            d: common_vendor.p({
              showLoading: true,
              src: item.Pictures[0].BigUrl,
              width: "180rpx",
              height: "180rpx"
            }),
            e: `/pages/detail/detail?id=${item.Id}`,
            f: common_vendor.t(item.Name),
            g: common_vendor.t(item.Price),
            h: common_vendor.o(($event) => editor(1, index), index),
            i: common_vendor.t(item.num),
            j: common_vendor.o(($event) => editor(0, index), index),
            k: index
          };
        }),
        f: common_vendor.unref(allChecked),
        g: common_vendor.o(handleItemAllCheck),
        h: common_vendor.t(common_vendor.unref(totalPrice)),
        i: common_vendor.t(common_vendor.unref(totalNum))
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__file", "E:/Uni-App/urshop/pages/cart/cart.vue"]]);
wx.createPage(MiniProgramPage);
