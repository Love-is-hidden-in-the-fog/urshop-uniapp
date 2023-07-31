"use strict";
const common_vendor = require("./common/vendor.js");
const whiteList = [
  // 注意入口页必须直接写 '/'
  // 支持正则表达式   { pattern: /^\/pages\/list.*/ }, 
  "/pages/Login/Login"
];
async function routingIntercept() {
  const list = ["navigateTo", "redirectTo", "reLaunch", "switchTab"];
  list.forEach((item) => {
    common_vendor.index.addInterceptor(item, {
      invoke(e) {
        let authorization = common_vendor.index.getStorageSync("token");
        const url = e.url.split("?")[0];
        if (!authorization) {
          console.log("没有token");
          let pass;
          if (whiteList) {
            pass = whiteList.some((item2) => {
              if (typeof item2 === "object" && item2.pattern) {
                return item2.pattern.test(url);
              }
              return url === item2;
            });
          }
          if (!pass) {
            common_vendor.index.redirectTo({
              url: "/pages/Login/Login"
            });
            return false;
          }
        }
        console.log("存在token");
        return e;
      },
      fail(err) {
        console.log(err);
      }
    });
  });
}
exports.routingIntercept = routingIntercept;
