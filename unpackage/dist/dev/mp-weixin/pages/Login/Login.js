"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_u_input2 = common_vendor.resolveComponent("u-input");
  const _easycom_u_button2 = common_vendor.resolveComponent("u-button");
  (_easycom_u_input2 + _easycom_u_button2)();
}
const _easycom_u_input = () => "../../uni_modules/uview-plus/components/u-input/u-input.js";
const _easycom_u_button = () => "../../uni_modules/uview-plus/components/u-button/u-button.js";
if (!Math) {
  (_easycom_u_input + _easycom_u_button)();
}
const _sfc_main = {
  __name: "Login",
  setup(__props) {
    const username = common_vendor.ref("admin");
    const password = common_vendor.ref("123456");
    const login = () => {
      if (username.value === "admin" && password.value === "123456") {
        common_vendor.index.showToast({
          title: "登录成功",
          duration: 1500,
          icon: "success"
        });
        console.log("登陆成功");
        common_vendor.index.setStorageSync("token", username.value);
        common_vendor.index.reLaunch({
          url: "/pages/index/index"
        });
      } else {
        common_vendor.index.showToast({
          title: "用户名或密码错误",
          duration: 1500,
          icon: "none"
        });
      }
    };
    return (_ctx, _cache) => {
      return {
        a: common_vendor.o(($event) => username.value = $event),
        b: common_vendor.p({
          placeholder: "请输入用户名",
          clear: true,
          maxlength: "20",
          modelValue: username.value
        }),
        c: common_vendor.o(($event) => password.value = $event),
        d: common_vendor.p({
          placeholder: "请输入密码",
          clear: true,
          password: true,
          maxlength: "16",
          modelValue: password.value
        }),
        e: common_vendor.o(login),
        f: common_vendor.p({
          round: true,
          type: "primary"
        })
      };
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-461d1d79"], ["__file", "E:/Uni-App/urshop/pages/Login/Login.vue"]]);
wx.createPage(MiniProgramPage);
