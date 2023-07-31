<template>
	<view class="container">
	  <view class="options-box">
	    <text class="option-title">当前</text>
	    <text class="option-adres">分店：{{currentAdres.Name}}</text>
	    <text class="option-info">分店地址：{{currentAdres.Address}}</text>
	    <u-icon class="right" name="checkmark" size="50rpx" color="#fff" ></u-icon>
	  </view>
	  <view class="options-box">
	    <text class="option-title">搜索</text>
	    <u-search @search="search" bgColor="#f5f5f5" :show-action="false" :clearabled="true" shape="round" placeholder="搜一搜" ></u-search>
	  </view>
	  <block v-if="!searchPage">
	    <view class="options-box">
	      <text class="option-title">附近</text>
	      <view class="marb" v-for=" (item,index) in AdresList" :key="index"  >
	        <text class="option-adres">分店：{{item.adres.Name}}</text>
	        <text class="option-info">分店地址：{{item.adres.Address}}</text>
	        <text class="distance" v-if="item.distance<1000">{{item.distance}}M</text>
	       <text class="distance" v-if="item.distance>=1000">{{item.distance/1000|Int}}KM</text>
	      </view>
	    </view>
	  </block>
	  <block v-if="searchPage">
	    <view class="options-box">
	      <view class="marb" v-for=" (item,index) in  searchList" :key="index"  >
	        <text class="option-adres">分店：{{item.adres.Name}}</text>
	        <text class="option-info">分店地址：{{item.adres.Address}}</text>
	        <text class="distance" v-if="item.distance<1000">{{item.distance}}M</text>
	        <text class="distance" v-if="item.distance>=1000">{{item.distance/1000|Int}}KM</text>
	      </view>
	      <view class="hide-no" v-if="!searchList.length">
	        <text>您搜索的分店暂未开通</text>
	      </view>
	    </view>
	  </block>
	</view>
</template>

<script setup >
	import {ref} from "vue"
	const currentAdres=ref({
		Name:"新地区",
		Address:""
	})
	const AdresList=ref([])
	const historyList=ref([])
	const searchList=ref([])
	const searclosebtn=ref(false)
	const searchPage=ref(false)
	const home=ref(false)
	const search=(e)=>{
		console.log(e);
	}
</script>

<style>
page{
  background-color: #f5f5f5;
}
.options-box{
  position: relative;
  background-color: #fff;
  margin-top: 20rpx;
  padding: 20rpx 40rpx;
}
.option-title,.option-adres,.option-info{
  display: block;
}
.option-title{
  margin-bottom: 10rpx;
}
.option-info{
  color: #999;
  font-size: 26rpx;
}
.options-box .right{
  position: absolute;
  right: 30rpx;
  top: 50rpx;
  background-color: #FD8C2E;
  border-radius: 50%;
}
.search-box{
  position: relative;
}
.search-box .search{
  position: absolute;
  top:-10rpx;
  left: 5rpx;
  color: #999;
  font-size: 50rpx;
}
.search-box .close{
  position: absolute;
  top: -3rpx;
  right: 20rpx;
  color: #999;
}
.hide-no{
  text-align: center;
  background-color: #fff;
  color: #999;
}
.marb{
  position: relative;
  padding-bottom: 20rpx;
  margin-bottom: 20rpx;
  border-bottom: 1px solid #ededed;
}
.distance{
  position: absolute;
  top: 0;
  right: 0;
  color: #B63C4A;
}
.option-flex{
  display: flex;
  justify-content: space-between;
}
.delet-hist{
  color: #666;
}
.searchXiaoqu{
  height: 60rpx;
  background-color: #f5f5f5;
  border-radius: 15px;
  padding-left: 60rpx;
  padding-right:70rpx;
  font-size: 26rpx;
  color: #666;
}
</style>
