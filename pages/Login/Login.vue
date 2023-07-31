<template>
  <view class="login-container">
    <view class="login-logo">登录</view>
    <view class="login-form">
      <u-input v-model="username" placeholder="请输入用户名" clear maxlength="20"></u-input>
      <u-input
        v-model="password"
        placeholder="请输入密码"
        clear
        password
        maxlength="16"
      ></u-input>
      <u-button round type="primary" @click="login">登录</u-button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('admin')
const password = ref('123456')

// 登录逻辑
const login = () => {
  // 在这里进行登录验证
  if (username.value === 'admin' && password.value === '123456') {
    uni.showToast({
      title: '登录成功',
      duration: 1500,
      icon: 'success'
    })
	console.log("登陆成功");
	uni.setStorageSync("token",username.value)
    // 登录成功后跳转到其他页面
    uni.reLaunch({
      url: '/pages/index/index'
    })
  } else {
    uni.showToast({
      title: '用户名或密码错误',
      duration: 1500,
      icon: 'none'
    })
  }
}
</script>

<style scoped >
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.login-logo {
  font-size: 48rpx;
  margin-bottom: 60rpx;
}

.login-form {
  width: 80%;
}

.u-button {
  margin-top: 40rpx;
}
.u-input{
	margin-top: 40rpx;
}
</style>