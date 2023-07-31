import App from './App'

// main.js
import uviewPlus from '@/uni_modules/uview-plus'

// 如此配置即可
uni.$u.config.unit = 'rpx'


// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})

app.use(uviewPlus)
app.$mount()

// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  return {
    app
  }
}
// #endif